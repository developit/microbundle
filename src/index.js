import fs from 'fs';
import { resolve, relative, dirname, basename, extname } from 'path';
import { green, red, yellow, white, blue } from 'kleur';
import { map, series } from 'asyncro';
import glob from 'tiny-glob/sync';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { rollup, watch } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import customBabel from './lib/babel-custom';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import alias from '@rollup/plugin-alias';
import postcss from 'rollup-plugin-postcss';
import gzipSize from 'gzip-size';
import brotliSize from 'brotli-size';
import prettyBytes from 'pretty-bytes';
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import logError from './log-error';
import { readFile, isDir, isFile, stdout, stderr, isTruthy } from './utils';
import camelCase from 'camelcase';
import escapeStringRegexp from 'escape-string-regexp';

const removeScope = name => name.replace(/^@.*\//, '');

// Convert booleans and int define= values to literals.
// This is more intuitive than `microbundle --define A=1` producing A="1".
const toReplacementExpression = (value, name) => {
	// --define A="1",B='true' produces string:
	const matches = value.match(/^(['"])(.+)\1$/);
	if (matches) {
		return [JSON.stringify(matches[2]), name];
	}

	// --define @assign=Object.assign replaces expressions with expressions:
	if (name[0] === '@') {
		return [value, name.substring(1)];
	}

	// --define A=1,B=true produces int/boolean literal:
	if (/^(true|false|\d+)$/i.test(value)) {
		return [value, name];
	}

	// default: string literal
	return [JSON.stringify(value), name];
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

// Parses values of the form "$=jQuery,React=react" into key-value object pairs.
const parseMappingArgumentAlias = aliasStrings => {
	return aliasStrings.split(',').map(str => {
		let [key, value] = str.split('=');
		return { find: key, replacement: value };
	});
};

// Extensions to use when resolving modules
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.es6', '.es', '.mjs'];

const WATCH_OPTS = {
	exclude: 'node_modules/**',
};

// Hoist function because something (rollup?) incorrectly removes it
function formatSize(size, filename, type, raw) {
	const pretty = raw ? `${size} B` : prettyBytes(size);
	const color = size < 5000 ? green : size > 40000 ? red : yellow;
	const MAGIC_INDENTATION = type === 'br' ? 13 : 10;
	return `${' '.repeat(MAGIC_INDENTATION - pretty.length)}${color(
		pretty,
	)}: ${white(basename(filename))}.${type}`;
}

async function getSizeInfo(code, filename, raw) {
	const gzip = formatSize(
		await gzipSize(code),
		filename,
		'gz',
		raw || code.length < 5000,
	);
	let brotli;
	//wrap brotliSize in try/catch in case brotli is unavailable due to
	//lower node version
	try {
		brotli = formatSize(
			await brotliSize(code),
			filename,
			'br',
			raw || code.length < 5000,
		);
	} catch (e) {
		return gzip;
	}
	return gzip + '\n' + brotli;
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

	// to disable compress you can put in false or 0 but it's a string so our boolean checks won't work
	options.compress =
		typeof options.compress !== 'boolean'
			? options.compress !== 'false' && options.compress !== '0'
			: options.compress;

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

	if (options.watch) {
		const onBuild = options.onBuild;
		return new Promise((resolve, reject) => {
			stdout(
				blue(
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
						options._sizeInfo.then(text => {
							stdout(`Wrote ${text.trim()}`);
						});
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
		steps.map(config => async () => {
			const { inputOptions, outputOptions } = config;
			if (inputOptions.cache !== false) {
				inputOptions.cache = cache;
			}
			let bundle = await rollup(inputOptions);
			cache = bundle;
			await bundle.write(outputOptions);
			return await config._sizeInfo;
		}),
	);

	return (
		blue(
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
			// `Warn ${yellow(`no package.json found. Assuming a pkg.name of "${pkgName}".`)}`
			yellow(
				`${yellow().inverse(
					'WARN',
				)} no package.json found. Assuming a pkg.name of "${pkgName}".`,
			),
		);

		let msg = String(err.message || err);
		if (!msg.match(/ENOENT/)) stderr(`  ${red().dim(msg)}`);

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
				yellow(
					`${yellow().inverse(
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
				: (source &&
						(Array.isArray(source) ? source : [source]).map(file =>
							resolve(cwd, file),
						)) ||
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

function getDeclarationDir({ options, pkg }) {
	const { cwd, output } = options;

	let result = output;

	if (pkg.types || pkg.typings) {
		result = pkg.types || pkg.typings;
		result = resolve(cwd, result);
	}

	result = dirname(result);

	return result;
}

async function getEntries({ input, cwd }) {
	let entries = (
		await map([].concat(input), async file => {
			file = resolve(cwd, file);
			if (await isDir(file)) {
				file = resolve(file, 'index.js');
			}
			return file;
		})
	).filter((item, i, arr) => arr.indexOf(item) === i);
	return entries;
}

function replaceName(filename, name) {
	return resolve(
		dirname(filename),
		name + basename(filename).replace(/^[^.]+/, ''),
	);
}

function getMain({ options, entry, format }) {
	const { pkg } = options;
	const pkgMain = options['pkg-main'];

	if (!pkgMain) {
		return options.output;
	}

	let mainNoExtension = options.output;
	if (options.multipleEntries) {
		let name = entry.match(/([\\/])index(\.(umd|cjs|es|m))?\.(mjs|[tj]sx?)$/)
			? mainNoExtension
			: entry;
		mainNoExtension = resolve(dirname(mainNoExtension), basename(name));
	}
	mainNoExtension = mainNoExtension.replace(
		/(\.(umd|cjs|es|m))?\.(mjs|[tj]sx?)$/,
		'',
	);

	const mainsByFormat = {};

	mainsByFormat.es = replaceName(
		pkg.module && !pkg.module.match(/src\//)
			? pkg.module
			: pkg['jsnext:main'] || 'x.esm.js',
		mainNoExtension,
	);
	mainsByFormat.modern = replaceName(
		(pkg.syntax && pkg.syntax.esmodules) || pkg.esmodule || 'x.modern.js',
		mainNoExtension,
	);
	mainsByFormat.cjs = replaceName(pkg['cjs:main'] || 'x.js', mainNoExtension);
	mainsByFormat.umd = replaceName(
		pkg['umd:main'] || 'x.umd.js',
		mainNoExtension,
	);

	return mainsByFormat[format] || mainsByFormat.cjs;
}

// shebang cache map because the transform only gets run once
const shebang = {};

function createConfig(options, entry, format, writeMeta) {
	let { pkg } = options;

	/** @type {(string|RegExp)[]} */
	let external = ['dns', 'fs', 'path', 'url'].concat(
		options.entries.filter(e => e !== entry),
	);

	/** @type {Record<string, string>} */
	let outputAliases = {};
	// since we transform src/index.js, we need to rename imports for it:
	if (options.multipleEntries) {
		outputAliases['.'] = './' + basename(options.output);
	}

	const moduleAliases = options.alias
		? parseMappingArgumentAlias(options.alias)
		: [];

	const peerDeps = Object.keys(pkg.peerDependencies || {});
	if (options.external === 'none') {
		// bundle everything (external=[])
	} else if (options.external) {
		external = external.concat(peerDeps).concat(
			// CLI --external supports regular expressions:
			options.external.split(',').map(str => new RegExp(str)),
		);
	} else {
		external = external
			.concat(peerDeps)
			.concat(Object.keys(pkg.dependencies || {}));
	}

	let globals = external.reduce((globals, name) => {
		// Use raw value for CLI-provided RegExp externals:
		if (name instanceof RegExp) name = name.source;

		// valid JS identifiers are usually library globals:
		if (name.match(/^[a-z_$][a-z0-9_\-$]*$/)) {
			globals[name] = camelCase(name);
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
			parseMappingArgument(options.define, toReplacementExpression),
		);
	}

	const modern = format === 'modern';

	// let rollupName = safeVariableName(basename(entry).replace(/\.js$/, ''));

	let nameCache = {};
	const bareNameCache = nameCache;
	// Support "minify" field and legacy "mangle" field via package.json:
	const rawMinifyValue = options.pkg.minify || options.pkg.mangle || {};
	let minifyOptions = typeof rawMinifyValue === 'string' ? {} : rawMinifyValue;
	const getNameCachePath =
		typeof rawMinifyValue === 'string'
			? () => resolve(options.cwd, rawMinifyValue)
			: () => resolve(options.cwd, 'mangle.json');

	const useTypescript = extname(entry) === '.ts' || extname(entry) === '.tsx';

	const escapeStringExternals = ext =>
		ext instanceof RegExp ? ext.source : escapeStringRegexp(ext);
	const externalPredicate = new RegExp(
		`^(${external.map(escapeStringExternals).join('|')})($|/)`,
	);
	const externalTest =
		external.length === 0 ? id => false : id => externalPredicate.test(id);

	function loadNameCache() {
		try {
			nameCache = JSON.parse(fs.readFileSync(getNameCachePath(), 'utf8'));
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

	/** @type {false | import('rollup').RollupCache} */
	let cache;
	if (modern) cache = false;

	let config = {
		/** @type {import('rollup').InputOptions} */
		inputOptions: {
			// disable Rollup's cache for the modern build to prevent re-use of legacy transpiled modules:
			cache,

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
						autoModules: shouldCssModules(options),
						modules: cssModulesConfig(options),
						// only write out CSS for the first bundle (avoids pointless extra files):
						inject: false,
						extract: !!writeMeta,
					}),
					moduleAliases.length > 0 &&
						alias({
							// @TODO: this is no longer supported, but didn't appear to be required?
							// resolve: EXTENSIONS,
							entries: moduleAliases,
						}),
					nodeResolve({
						mainFields: ['module', 'jsnext', 'main'],
						browser: options.target !== 'node',
						// defaults + .jsx
						extensions: ['.mjs', '.js', '.jsx', '.json', '.node'],
						preferBuiltins: options.target === 'node',
					}),
					commonjs({
						// use a regex to make sure to include eventual hoisted packages
						include: /\/node_modules\//,
					}),
					json(),
					{
						// We have to remove shebang so it doesn't end up in the middle of the code somewhere
						transform: code => ({
							code: code.replace(/^#![^\n]*/, bang => {
								shebang[options.name] = bang;
							}),
							map: null,
						}),
					},
					useTypescript &&
						typescript({
							typescript: require('typescript'),
							cacheRoot: `./node_modules/.cache/.rts2_cache_${format}`,
							useTsconfigDeclarationDir: true,
							tsconfigDefaults: {
								compilerOptions: {
									sourceMap: options.sourcemap,
									declaration: true,
									declarationDir: getDeclarationDir({ options, pkg }),
									jsx: 'react',
									jsxFactory:
										// TypeScript fails to resolve Fragments when jsxFactory
										// is set, even when it's the same as the default value.
										options.jsx === 'React.createElement'
											? undefined
											: options.jsx || 'h',
								},
								files: options.entries,
							},
							tsconfig: options.tsconfig,
							tsconfigOverride: {
								compilerOptions: {
									module: 'ESNext',
									target: 'esnext',
								},
							},
						}),
					// if defines is not set, we shouldn't run babel through node_modules
					isTruthy(defines) &&
						babel({
							babelHelpers: 'bundled',
							babelrc: false,
							compact: false,
							configFile: false,
							include: 'node_modules/**',
							plugins: [
								[
									require.resolve('babel-plugin-transform-replace-expressions'),
									{ replace: defines },
								],
							],
						}),
					customBabel()({
						babelHelpers: 'bundled',
						extensions: EXTENSIONS,
						exclude: 'node_modules/**',
						passPerPreset: true, // @see https://babeljs.io/docs/en/options#passperpreset
						custom: {
							defines,
							modern,
							compress: options.compress !== false,
							targets: options.target === 'node' ? { node: '8' } : undefined,
							pragma: options.jsx || 'h',
							pragmaFrag: options.jsxFragment || 'Fragment',
							typescript: !!useTypescript,
						},
					}),
					options.compress !== false && [
						terser({
							sourcemap: true,
							compress: Object.assign(
								{
									keep_infinity: true,
									pure_getters: true,
									// Ideally we'd just get Terser to respect existing Arrow functions...
									// unsafe_arrows: true,
									passes: 10,
								},
								minifyOptions.compress || {},
							),
							output: {
								// By default, Terser wraps function arguments in extra parens to trigger eager parsing.
								// Whether this is a good idea is way too specific to guess, so we optimize for size by default:
								wrap_func_args: false,
								comments: false,
							},
							warnings: true,
							ecma: modern ? 9 : 5,
							toplevel: modern || format === 'cjs' || format === 'es',
							mangle: Object.assign({}, minifyOptions.mangle || {}),
							nameCache,
						}),
						nameCache && {
							// before hook
							options: loadNameCache,
							// after hook
							writeBundle() {
								if (writeMeta && nameCache) {
									fs.writeFile(
										getNameCachePath(),
										JSON.stringify(nameCache, null, 2),
										() => {},
									);
								}
							},
						},
					],
					{
						writeBundle(bundle) {
							config._sizeInfo = Promise.all(
								Object.values(bundle).map(({ code, fileName }) => {
									if (code) {
										return getSizeInfo(code, fileName, options.raw);
									}
								}),
							).then(results => results.filter(Boolean).join('\n'));
						},
					},
				)
				.filter(Boolean),
		},

		/** @type {import('rollup').OutputOptions} */
		outputOptions: {
			paths: outputAliases,
			globals,
			strict: options.strict === true,
			freeze: false,
			esModule: false,
			sourcemap: options.sourcemap,
			get banner() {
				return shebang[options.name];
			},
			format: modern ? 'es' : format,
			name: options.name,
			file: resolve(options.cwd, getMain({ options, entry, format })),
		},
	};

	return config;
}

function shouldCssModules(options) {
	const passedInOption = processCssmodulesArgument(options);

	// We should module when my-file.module.css or my-file.css
	const moduleAllCss = passedInOption === true;

	// We should module when my-file.module.css
	const allowOnlySuffixModule = passedInOption === null;

	return moduleAllCss || allowOnlySuffixModule;
}

function cssModulesConfig(options) {
	const passedInOption = processCssmodulesArgument(options);
	const isWatchMode = options.watch;
	const hasPassedInScopeName = !(
		typeof passedInOption === 'boolean' || passedInOption === null
	);

	if (shouldCssModules(options) || hasPassedInScopeName) {
		let generateScopedName = isWatchMode
			? '_[name]__[local]__[hash:base64:5]'
			: '_[hash:base64:5]';

		if (hasPassedInScopeName) {
			generateScopedName = passedInOption; // would be the string from --css-modules "_[hash]".
		}

		return { generateScopedName };
	}

	return false;
}

/*
This is done becuase if you use the cli default property, you get a primiatve "null" or "false",
but when using the cli arguments, you always get back strings. This method aims at correcting those
for both realms. So that both realms _convert_ into primatives.
*/
function processCssmodulesArgument(options) {
	if (options['css-modules'] === 'true' || options['css-modules'] === true)
		return true;
	if (options['css-modules'] === 'false' || options['css-modules'] === false)
		return false;
	if (options['css-modules'] === 'null' || options['css-modules'] === null)
		return null;

	return options['css-modules'];
}
