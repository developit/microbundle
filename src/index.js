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
import postcss from 'rollup-plugin-postcss';
import alias from 'rollup-plugin-strict-alias';
import gzipSize from 'gzip-size';
import brotliSize from 'brotli-size';
import prettyBytes from 'pretty-bytes';
import shebangPlugin from 'rollup-plugin-preserve-shebang';
import typescript from 'rollup-plugin-typescript2';
import flow from './lib/flow-plugin';
import logError from './log-error';
import { readFile, isDir, isFile, stdout, stderr } from './utils';
import camelCase from 'camelcase';

const removeScope = name => name.replace(/^@.*\//, '');
const safeVariableName = name =>
	camelCase(
		removeScope(name)
			.toLowerCase()
			.replace(/((^[^a-zA-Z]+)|[^\w.-])|([^a-zA-Z0-9]+$)/g, ''),
	);
const parseGlobals = globalStrings => {
	const globals = {};
	globalStrings.split(',').forEach(globalString => {
		const [localName, globalName] = globalString.split('=');
		globals[localName] = globalName;
	});
	return globals;
};

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

export default async function microbundle(options) {
	let cwd = (options.cwd = resolve(process.cwd(), options.cwd)),
		hasPackageJson = true;

	try {
		options.pkg = JSON.parse(
			await readFile(resolve(cwd, 'package.json'), 'utf8'),
		);
	} catch (err) {
		stderr(
			chalk.yellow(
				`${chalk.yellow.inverse(
					'WARN',
				)} no package.json found. Assuming a pkg.name of "${basename(
					options.cwd,
				)}".`,
			),
		);
		let msg = String(err.message || err);
		if (!msg.match(/ENOENT/)) stderr(`  ${chalk.red.dim(msg)}`);
		options.pkg = {};
		hasPackageJson = false;
	}

	if (!options.pkg.name) {
		options.pkg.name = basename(options.cwd);
		if (hasPackageJson) {
			stderr(
				chalk.yellow(
					`${chalk.yellow.inverse(
						'WARN',
					)} missing package.json "name" field. Assuming "${
						options.pkg.name
					}".`,
				),
			);
		}
	}

	options.name =
		options.name || options.pkg.amdName || safeVariableName(options.pkg.name);

	if (options.sourcemap !== false) {
		options.sourcemap = true;
	}

	const jsOrTs = async filename =>
		resolve(
			cwd,
			`${filename}${
				(await isFile(resolve(cwd, filename + '.ts')))
					? '.ts'
					: (await isFile(resolve(cwd, filename + '.tsx')))
					? '.tsx'
					: '.js'
			}`,
		);

	options.input = [];
	[]
		.concat(
			options.entries && options.entries.length
				? options.entries
				: (options.pkg.source && resolve(cwd, options.pkg.source)) ||
						((await isDir(resolve(cwd, 'src'))) &&
							(await jsOrTs('src/index'))) ||
						(await jsOrTs('index')) ||
						options.pkg.module,
		)
		.map(file => glob(file))
		.forEach(file => options.input.push(...file));

	let main = resolve(cwd, options.output || options.pkg.main || 'dist');
	if (!main.match(/\.[a-z]+$/) || (await isDir(main))) {
		main = resolve(main, `${removeScope(options.pkg.name)}.js`);
	}
	options.output = main;

	let entries = (await map([].concat(options.input), async file => {
		file = resolve(cwd, file);
		if (await isDir(file)) {
			file = resolve(file, 'index.js');
		}
		return file;
	})).filter((item, i, arr) => arr.indexOf(item) === i);

	options.entries = entries;

	options.multipleEntries = entries.length > 1;

	let formats = (options.format || options.formats).split(',');
	// always compile cjs first if it's there:
	formats.sort((a, b) => (a === 'cjs' ? -1 : a > b ? 1 : 0));

	let steps = [];
	for (let i = 0; i < entries.length; i++) {
		for (let j = 0; j < formats.length; j++) {
			steps.push(
				createConfig(options, entries[i], formats[j], i === 0 && j === 0),
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

function createConfig(options, entry, format, writeMeta) {
	let { pkg } = options;

	let external = ['dns', 'fs', 'path', 'url'].concat(
		options.entries.filter(e => e !== entry),
	);

	let aliases = {};
	// since we transform src/index.js, we need to rename imports for it:
	if (options.multipleEntries) {
		aliases['.'] = './' + basename(options.output);
	}

	let useNodeResolve = true;
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
		globals = Object.assign(globals, parseGlobals(options.globals));
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
	let mangleOptions = options.pkg.mangle || false;

	let exportType;
	if (format !== 'es') {
		try {
			let file = fs.readFileSync(entry, 'utf-8');
			let hasDefault = /\bexport\s*default\s*[a-zA-Z_$]/.test(file);
			let hasNamed =
				/\bexport\s*(let|const|var|async|function\*?)\s*[a-zA-Z_$*]/.test(
					file,
				) || /^\s*export\s*\{/m.test(file);
			if (hasDefault && hasNamed) exportType = 'default';
		} catch (e) {}
	}

	const useTypescript = extname(entry) === '.ts' || extname(entry) === '.tsx';

	const externalPredicate = new RegExp(`^(${external.join('|')})($|/)`);
	const externalTest =
		external.length === 0 ? () => false : id => externalPredicate.test(id);

	function loadNameCache() {
		try {
			nameCache = JSON.parse(
				fs.readFileSync(resolve(options.cwd, 'mangle.json'), 'utf8'),
			);
		} catch (e) {}
	}
	loadNameCache();

	let shebang;

	let config = {
		inputOptions: {
			input: exportType ? resolve(__dirname, '../src/lib/__entry__.js') : entry,
			external: id => {
				if (id === 'babel-plugin-transform-async-to-promises/helpers') {
					return false;
				}
				if (options.multipleEntries && id === '.') {
					return true;
				}
				return externalTest(id);
			},
			plugins: []
				.concat(
					alias({
						__microbundle_entry__: entry,
					}),
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
									target: 'es2017',
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
						exclude: 'node_modules/**',
						plugins: [
							'@babel/plugin-syntax-jsx',
							[
								'babel-plugin-transform-async-to-promises',
								{ inlineHelpers: true, externalHelpers: true },
							],
							['@babel/plugin-proposal-class-properties', { loose: true }],
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
					useNodeResolve &&
						commonjs({
							include: 'node_modules/**',
						}),
					useNodeResolve &&
						nodeResolve({
							module: true,
							jsnext: true,
							browser: options.target !== 'node',
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
							compress: {
								keep_infinity: true,
								pure_getters: true,
							},
							warnings: true,
							ecma: 5,
							toplevel: format === 'cjs' || format === 'es',
							mangle: {
								properties: mangleOptions
									? {
											regex: mangleOptions.regex
												? new RegExp(mangleOptions.regex)
												: null,
											reserved: mangleOptions.reserved || [],
									  }
									: false,
							},
							nameCache,
						}),
						mangleOptions && {
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
			exports: exportType ? 'default' : undefined,
			paths: aliases,
			globals,
			strict: options.strict === true,
			legacy: true,
			freeze: false,
			esModule: false,
			sourcemap: options.sourcemap,
			treeshake: {
				propertyReadSideEffects: false,
			},
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
