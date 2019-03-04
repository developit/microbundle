import fs from 'fs';
import { resolve, relative, dirname, basename, extname } from 'path';
import chalk from 'chalk';
import { map, series } from 'asyncro';
import glob from 'tiny-glob/sync';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { rollup, watch } from 'rollup';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import buble from 'rollup-plugin-buble';
import { terser } from 'rollup-plugin-terser';
import alias from 'rollup-plugin-alias';
import postcss from 'rollup-plugin-postcss';
import gzipSize from 'gzip-size';
import brotliSize from 'brotli-size';
import prettyBytes from 'pretty-bytes';
import shebangPlugin from 'rollup-plugin-preserve-shebang';
import typescript from 'rollup-plugin-typescript2';
import json from 'rollup-plugin-json';
import flow from './lib/flow-plugin';
import logError from './log-error';
import { readFile, isDir, isFile, stdout, stderr } from './utils';
import camelCase from 'camelcase';

const removeScope = name => name.replace(/^@.*\//, '');

// Convert booleans and int define= values to literals.
// This is more intuitive than `microbundle --define A=1` producing A="1".
// See: https://github.com/terser-js/terser#conditional-compilation-api
const toTerserLiteral = (value, name) => {
	// --define A="1",B='true' produces string:
	const matches = value.match(/^(['"])(.+)\1$/);
	if (matches) {
		return [matches[2], name];
	}

	// --define A=1,B=true produces int/boolean literal:
	if (/^(true|false|\d+)$/i.test(value)) {
		return [value, '@' + name];
	}

	// default: behaviour from Terser (@prefix=1 produces expression/literal, unprefixed=1 produces string literal):
};

// Normalize Terser options from microbundle's relaxed JSON format (mutates argument in-place)
function normalizeMinifyOptions(minifyOptions) {
	const mangle = minifyOptions.mangle || (minifyOptions.mangle = {});
	let properties = mangle.properties;

	// allow top-level "properties" key to override mangle.properties (including {properties:false}):
	if (minifyOptions.properties != null) {
		properties = mangle.properties =
			minifyOptions.properties &&
			Object.assign(properties, minifyOptions.properties);
	}

	// allow previous format ({ mangle:{regex:'^_',reserved:[]} }):
	if (minifyOptions.regex || minifyOptions.reserved) {
		if (!properties) properties = mangle.properties = {};
		properties.regex = properties.regex || minifyOptions.regex;
		properties.reserved = properties.reserved || minifyOptions.reserved;
	}

	if (properties) {
		if (properties.regex) properties.regex = new RegExp(properties.regex);
		properties.reserved = [].concat(properties.reserved || []);
	}
}

// Parses values of the form "$=jQuery,React=react" into key-value object pairs.
const parseMappingArgument = (globalStrings, processValue) => {
	const globals = {};
	globalStrings.split(',').forEach(globalString => {
		let [key, value] = globalString.split('=');
		if (processValue) {
			const r = processValue(value, key);
			if (r !== undefined) {
				if (Array.isArray(r)) {
					[value, key] = r;
				} else {
					value = r;
				}
			}
		}
		globals[key] = value;
	});
	return globals;
};

// Extensions to use when resolving modules
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.es6', '.es', '.mjs'];

const WATCH_OPTS = {
	exclude: 'node_modules/**',
};

// Hoist function because something (rollup?) incorrectly removes it
function formatSize(size, filename, type, raw) {
	const pretty = raw ? `${size} B` : prettyBytes(size);
	const color = size < 5000 ? 'green' : size > 40000 ? 'red' : 'yellow';
	const MAGIC_INDENTATION = type === 'br' ? 13 : 10;
	return `${' '.repeat(MAGIC_INDENTATION - pretty.length)}${chalk[color](
		pretty,
	)}: ${chalk.white(basename(filename))}.${type}`;
}

export default async function microbundle(inputOptions) {
	let options = { ...inputOptions };

	options.cwd = resolve(process.cwd(), inputOptions.cwd);
	const cwd = options.cwd;

	const { hasPackageJson, pkg } = await getConfigFromPkgJson(cwd);
	options.pkg = pkg;

	const { finalName, pkgName } = getName({
		name: options.name,
		pkgName: options.pkg.name,
		amdName: options.pkg.amdName,
		hasPackageJson,
		cwd,
	});

	options.name = finalName;
	options.pkg.name = pkgName;

	if (options.sourcemap !== false) {
		options.sourcemap = true;
	}

	options.input = await getInput({
		entries: options.entries,
		cwd,
		source: options.pkg.source,
		module: options.pkg.module,
	});

	options.output = await getOutput({
		cwd,
		output: options.output,
		pkgMain: options.pkg.main,
		pkgName: options.pkg.name,
	});

	options.entries = await getEntries({
		cwd,
		input: options.input,
	});

	options.multipleEntries = options.entries.length > 1;

	let formats = (options.format || options.formats).split(',');
	// always compile cjs first if it's there:
	formats.sort((a, b) => (a === 'cjs' ? -1 : a > b ? 1 : 0));

	let steps = [];
	for (let i = 0; i < options.entries.length; i++) {
		for (let j = 0; j < formats.length; j++) {
			steps.push(
				createConfig(
					options,
					options.entries[i],
					formats[j],
					i === 0 && j === 0,
				),
			);
		}
	}

	async function getSizeInfo(code, filename) {
		const raw = options.raw || code.length < 5000;
		const gzip = formatSize(await gzipSize(code), filename, 'gz', raw);
		const brotli = formatSize(await brotliSize(code), filename, 'br', raw);
		return gzip + '\n' + brotli;
	}

	if (options.watch) {
		const onBuild = options.onBuild;
		return new Promise((resolve, reject) => {
			stdout(
				chalk.blue(
					`Watching source, compiling to ${relative(
						cwd,
						dirname(options.output),
					)}:`,
				),
			);
			steps.map(options => {
				watch(
					Object.assign(
						{
							output: options.outputOptions,
							watch: WATCH_OPTS,
						},
						options.inputOptions,
					),
				).on('event', e => {
					if (e.code === 'FATAL') {
						return reject(e.error);
					} else if (e.code === 'ERROR') {
						logError(e.error);
					}
					if (e.code === 'END') {
						getSizeInfo(options._code, options.outputOptions.file).then(
							text => {
								stdout(`Wrote ${text.trim()}`);
							},
						);
						if (typeof onBuild === 'function') {
							onBuild(e);
						}
					}
				});
			});
		});
	}

	let cache;
	let out = await series(
		steps.map(({ inputOptions, outputOptions }) => async () => {
			inputOptions.cache = cache;
			let bundle = await rollup(inputOptions);
			cache = bundle;
			const { code } = await bundle.write(outputOptions);
			return await getSizeInfo(code, outputOptions.file);
		}),
	);

	return (
		chalk.blue(
			`Build "${options.name}" to ${relative(cwd, dirname(options.output)) ||
				'.'}:`,
		) +
		'\n   ' +
		out.join('\n   ')
	);
}

async function getConfigFromPkgJson(cwd) {
	try {
		const pkgJSON = await readFile(resolve(cwd, 'package.json'), 'utf8');
		const pkg = JSON.parse(pkgJSON);

		return {
			hasPackageJson: true,
			pkg,
		};
	} catch (err) {
		const pkgName = basename(cwd);

		stderr(
			chalk.yellow(
				`${chalk.yellow.inverse(
					'WARN',
				)} no package.json found. Assuming a pkg.name of "${pkgName}".`,
			),
		);

		let msg = String(err.message || err);
		if (!msg.match(/ENOENT/)) stderr(`  ${chalk.red.dim(msg)}`);

		return { hasPackageJson: false, pkg: { name: pkgName } };
	}
}

const safeVariableName = name =>
	camelCase(
		removeScope(name)
			.toLowerCase()
			.replace(/((^[^a-zA-Z]+)|[^\w.-])|([^a-zA-Z0-9]+$)/g, ''),
	);

function getName({ name, pkgName, amdName, cwd, hasPackageJson }) {
	if (!pkgName) {
		pkgName = basename(cwd);
		if (hasPackageJson) {
			stderr(
				chalk.yellow(
					`${chalk.yellow.inverse(
						'WARN',
					)} missing package.json "name" field. Assuming "${pkgName}".`,
				),
			);
		}
	}

	return { finalName: name || amdName || safeVariableName(pkgName), pkgName };
}

async function jsOrTs(cwd, filename) {
	const extension = (await isFile(resolve(cwd, filename + '.ts')))
		? '.ts'
		: (await isFile(resolve(cwd, filename + '.tsx')))
		? '.tsx'
		: '.js';

	return resolve(cwd, `${filename}${extension}`);
}

async function getInput({ entries, cwd, source, module }) {
	const input = [];

	[]
		.concat(
			entries && entries.length
				? entries
				: (source && resolve(cwd, source)) ||
						((await isDir(resolve(cwd, 'src'))) &&
							(await jsOrTs(cwd, 'src/index'))) ||
						(await jsOrTs(cwd, 'index')) ||
						module,
		)
		.map(file => glob(file))
		.forEach(file => input.push(...file));

	return input;
}

async function getOutput({ cwd, output, pkgMain, pkgName }) {
	let main = resolve(cwd, output || pkgMain || 'dist');
	if (!main.match(/\.[a-z]+$/) || (await isDir(main))) {
		main = resolve(main, `${removeScope(pkgName)}.js`);
	}
	return main;
}

async function getEntries({ input, cwd }) {
	let entries = (await map([].concat(input), async file => {
		file = resolve(cwd, file);
		if (await isDir(file)) {
			file = resolve(file, 'index.js');
		}
		return file;
	})).filter((item, i, arr) => arr.indexOf(item) === i);
	return entries;
}

function createConfig(options, entry, format, writeMeta) {
	let { pkg } = options;

	let external = ['dns', 'fs', 'path', 'url'].concat(
		options.entries.filter(e => e !== entry),
	);

	let outputAliases = {};
	// since we transform src/index.js, we need to rename imports for it:
	if (options.multipleEntries) {
		outputAliases['.'] = './' + basename(options.output);
	}

	const moduleAliases = options.alias
		? parseMappingArgument(options.alias)
		: {};

	const peerDeps = Object.keys(pkg.peerDependencies || {});
	if (options.external === 'none') {
		// bundle everything (external=[])
	} else if (options.external) {
		external = external.concat(peerDeps).concat(options.external.split(','));
	} else {
		external = external
			.concat(peerDeps)
			.concat(Object.keys(pkg.dependencies || {}));
	}

	let globals = external.reduce((globals, name) => {
		// valid JS identifiers are usually library globals:
		if (name.match(/^[a-z_$][a-z0-9_$]*$/)) {
			globals[name] = name;
		}
		return globals;
	}, {});
	if (options.globals && options.globals !== 'none') {
		globals = Object.assign(globals, parseMappingArgument(options.globals));
	}

	let defines = {};
	if (options.define) {
		defines = Object.assign(
			defines,
			parseMappingArgument(options.define, toTerserLiteral),
		);
	}

	function replaceName(filename, name) {
		return resolve(
			dirname(filename),
			name + basename(filename).replace(/^[^.]+/, ''),
		);
	}

	let mainNoExtension = options.output;
	if (options.multipleEntries) {
		let name = entry.match(/([\\/])index(\.(umd|cjs|es|m))?\.m?js$/)
			? mainNoExtension
			: entry;
		mainNoExtension = resolve(dirname(mainNoExtension), basename(name));
	}
	mainNoExtension = mainNoExtension.replace(/(\.(umd|cjs|es|m))?\.m?js$/, '');

	let moduleMain = replaceName(
		pkg.module && !pkg.module.match(/src\//)
			? pkg.module
			: pkg['jsnext:main'] || 'x.mjs',
		mainNoExtension,
	);
	let cjsMain = replaceName(pkg['cjs:main'] || 'x.js', mainNoExtension);
	let umdMain = replaceName(pkg['umd:main'] || 'x.umd.js', mainNoExtension);

	// let rollupName = safeVariableName(basename(entry).replace(/\.js$/, ''));

	let nameCache = {};
	const bareNameCache = nameCache;
	// Support "minify" field and legacy "mangle" field via package.json:
	let minifyOptions = options.pkg.minify || options.pkg.mangle || {};

	const useTypescript = extname(entry) === '.ts' || extname(entry) === '.tsx';

	const externalPredicate = new RegExp(`^(${external.join('|')})($|/)`);
	const externalTest =
		external.length === 0 ? () => false : id => externalPredicate.test(id);

	function loadNameCache() {
		try {
			nameCache = JSON.parse(
				fs.readFileSync(resolve(options.cwd, 'mangle.json'), 'utf8'),
			);
			// mangle.json can contain a "minify" field, same format as the pkg.mangle:
			if (nameCache.minify) {
				minifyOptions = Object.assign(
					{},
					minifyOptions || {},
					nameCache.minify,
				);
			}
		} catch (e) {}
	}
	loadNameCache();

	normalizeMinifyOptions(minifyOptions);

	if (nameCache === bareNameCache) nameCache = null;

	let shebang;

	let config = {
		inputOptions: {
			input: entry,
			external: id => {
				if (id === 'babel-plugin-transform-async-to-promises/helpers') {
					return false;
				}
				if (options.multipleEntries && id === '.') {
					return true;
				}
				return externalTest(id);
			},
			treeshake: {
				propertyReadSideEffects: false,
			},
			plugins: []
				.concat(
					postcss({
						plugins: [
							autoprefixer(),
							options.compress !== false &&
								cssnano({
									preset: 'default',
								}),
						].filter(Boolean),
						// only write out CSS for the first bundle (avoids pointless extra files):
						inject: false,
						extract: !!writeMeta,
					}),
					Object.keys(moduleAliases).length > 0 &&
						alias(
							Object.assign({}, moduleAliases, {
								resolve: EXTENSIONS,
							}),
						),
					nodeResolve({
						module: true,
						jsnext: true,
						browser: options.target !== 'node',
					}),
					commonjs({
						// use a regex to make sure to include eventual hoisted packages
						include: /\/node_modules\//,
					}),
					json(),
					useTypescript &&
						typescript({
							typescript: require('typescript'),
							cacheRoot: `./.rts2_cache_${format}`,
							tsconfigDefaults: {
								compilerOptions: {
									sourceMap: options.sourcemap,
									declaration: true,
									jsx: options.jsx,
								},
							},
							tsconfigOverride: {
								compilerOptions: {
									target: 'esnext',
								},
							},
						}),
					!useTypescript && flow({ all: true, pretty: true }),
					// Only used for async await
					babel({
						// We mainly use bublé to transpile JS and only use babel to
						// transpile down `async/await`. To prevent conflicts with user
						// supplied configurations we set this option to false. Note
						// that we never supported using custom babel configs anyway.
						babelrc: false,
						extensions: EXTENSIONS,
						exclude: 'node_modules/**',
						plugins: [
							require.resolve('@babel/plugin-syntax-jsx'),
							[
								require.resolve('babel-plugin-transform-async-to-promises'),
								{ inlineHelpers: true, externalHelpers: true },
							],
							[
								require.resolve('@babel/plugin-proposal-class-properties'),
								{ loose: true },
							],
						],
					}),
					{
						// Custom plugin that removes shebang from code because newer
						// versions of bublé bundle their own private version of `acorn`
						// and I don't know a way to patch in the option `allowHashBang`
						// to acorn.
						// See: https://github.com/Rich-Harris/buble/pull/165
						transform(code) {
							let reg = /^#!(.*)/;
							let match = code.match(reg);

							if (match !== null) {
								shebang = '#!' + match[0];
							}

							code = code.replace(reg, '');

							return {
								code,
								map: null,
							};
						},
					},
					buble({
						exclude: 'node_modules/**',
						jsx: options.jsx || 'h',
						objectAssign: options.assign || 'Object.assign',
						transforms: {
							dangerousForOf: true,
							dangerousTaggedTemplateString: true,
						},
					}),
					// We should upstream this to rollup
					// format==='cjs' && replace({
					// 	[`module.exports = ${rollupName};`]: '',
					// 	[`var ${rollupName} =`]: 'module.exports ='
					// }),
					// This works for the general case, but could cause nasty scope bugs.
					// format==='umd' && replace({
					// 	[`return ${rollupName};`]: '',
					// 	[`var ${rollupName} =`]: 'return'
					// }),
					// format==='es' && replace({
					// 	[`export default ${rollupName};`]: '',
					// 	[`var ${rollupName} =`]: 'export default'
					// }),
					options.compress !== false && [
						terser({
							sourcemap: true,
							output: { comments: false },
							compress: Object.assign(
								{
									keep_infinity: true,
									pure_getters: true,
									global_defs: defines,
									passes: 10,
								},
								minifyOptions.compress || {},
							),
							warnings: true,
							ecma: 5,
							toplevel: format === 'cjs' || format === 'es',
							mangle: Object.assign({}, minifyOptions.mangle || {}),
							nameCache,
						}),
						nameCache && {
							// before hook
							options: loadNameCache,
							// after hook
							onwrite() {
								if (writeMeta && nameCache) {
									fs.writeFile(
										resolve(options.cwd, 'mangle.json'),
										JSON.stringify(nameCache, null, 2),
										Object,
									);
								}
							},
						},
					],
					{
						ongenerate(outputOptions, { code }) {
							config._code = code;
						},
					},
					shebangPlugin({
						shebang,
					}),
				)
				.filter(Boolean),
		},

		outputOptions: {
			paths: outputAliases,
			globals,
			strict: options.strict === true,
			legacy: true,
			freeze: false,
			esModule: false,
			sourcemap: options.sourcemap,
			format,
			name: options.name,
			file: resolve(
				options.cwd,
				(format === 'es' && moduleMain) ||
					(format === 'umd' && umdMain) ||
					cjsMain,
			),
		},
	};

	return config;
}
