import fs from 'fs';
import { resolve, relative, dirname, basename, extname } from 'path';
import camelCase from 'camelcase';
import escapeStringRegexp from 'escape-string-regexp';
import { blue } from 'kleur';
import { map, series } from 'asyncro';
import glob from 'tiny-glob/sync';
import autoprefixer from 'autoprefixer';
import { rollup, watch } from 'rollup';
import builtinModules from 'builtin-modules';
import resolveFrom from 'resolve-from';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import customBabel from './lib/babel-custom';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import alias from '@rollup/plugin-alias';
import postcss from 'rollup-plugin-postcss';
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import logError from './log-error';
import { isDir, isFile, stdout, isTruthy, removeScope } from './utils';
import { getSizeInfo } from './lib/compressed-size';
import { normalizeMinifyOptions } from './lib/terser';
import {
	parseAliasArgument,
	parseMappingArgument,
	toReplacementExpression,
} from './lib/option-normalization';
import { getConfigFromPkgJson, getName } from './lib/package-info';
import { shouldCssModules, cssModulesConfig } from './lib/css-modules';

// Extensions to use when resolving modules
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.es6', '.es', '.mjs'];

const WATCH_OPTS = {
	exclude: 'node_modules/**',
};

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
	// de-dupe formats and convert "esm" to "es":
	formats = Array.from(new Set(formats.map(f => (f === 'esm' ? 'es' : f))));
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
		return doWatch(options, cwd, steps);
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

	const targetDir = relative(cwd, dirname(options.output)) || '.';
	const banner = blue(`Build "${options.name}" to ${targetDir}:`);
	return {
		output: `${banner}\n   ${out.join('\n   ')}`,
	};
}

function doWatch(options, cwd, steps) {
	const { onStart, onBuild, onError } = options;

	return new Promise((resolve, reject) => {
		const targetDir = relative(cwd, dirname(options.output));
		stdout(blue(`Watching source, compiling to ${targetDir}:`));

		const watchers = steps.reduce((acc, options) => {
			acc[options.inputOptions.input] = watch(
				Object.assign(
					{
						output: options.outputOptions,
						watch: WATCH_OPTS,
					},
					options.inputOptions,
				),
			).on('event', e => {
				if (e.code === 'START') {
					if (typeof onStart === 'function') {
						onStart(e);
					}
				}
				if (e.code === 'ERROR') {
					logError(e.error);
					if (typeof onError === 'function') {
						onError(e);
					}
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

			return acc;
		}, {});

		resolve({ watchers });
	});
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
		pkg['umd:main'] || pkg.unpkg || 'x.umd.js',
		mainNoExtension,
	);

	return mainsByFormat[format] || mainsByFormat.cjs;
}

// shebang cache map because the transform only gets run once
const shebang = {};

function createConfig(options, entry, format, writeMeta) {
	let { pkg } = options;

	/** @type {(string|RegExp)[]} */
	let external = ['dns', 'fs', 'path', 'url'];

	/** @type {Record<string, string>} */
	let outputAliases = {};

	const moduleAliases = options.alias ? parseAliasArgument(options.alias) : [];
	const aliasIds = moduleAliases.map(alias => alias.find);

	// We want to silence rollup warnings for node builtins as we rollup-node-resolve threats them as externals anyway
	// @see https://github.com/rollup/plugins/tree/master/packages/node-resolve/#resolving-built-ins-like-fs
	if (options.target === 'node') {
		external = external.concat(builtinModules);
	}

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

	const absMain = resolve(options.cwd, getMain({ options, entry, format }));
	const outputDir = dirname(absMain);
	const outputEntryFileName = basename(absMain);

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

				if (aliasIds.indexOf(id) >= 0) {
					return false;
				}
				return externalTest(id);
			},

			onwarn(warning, warn) {
				// https://github.com/rollup/rollup/blob/0fa9758cb7b1976537ae0875d085669e3a21e918/src/utils/error.ts#L324
				if (warning.code === 'UNRESOLVED_IMPORT') {
					stdout(
						`Failed to resolve the module ${warning.source} imported by ${warning.importer}` +
							`\nIs the module installed? Note:` +
							`\n ↳ to inline a module into your bundle, install it to "devDependencies".` +
							`\n ↳ to depend on a module via import/require, install it to "dependencies".`,
					);
					return;
				}

				warn(warning);
			},

			treeshake: {
				propertyReadSideEffects: false,
			},

			plugins: []
				.concat(
					postcss({
						plugins: [autoprefixer()],
						autoModules: shouldCssModules(options),
						modules: cssModulesConfig(options),
						// only write out CSS for the first bundle (avoids pointless extra files):
						inject: false,
						extract: !!writeMeta,
						minimize: options.compress,
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
							typescript: require(resolveFrom.silent(
								options.cwd,
								'typescript',
							) || 'typescript'),
							cacheRoot: `./node_modules/.cache/.rts2_cache_${format}`,
							useTsconfigDeclarationDir: true,
							tsconfigDefaults: {
								compilerOptions: {
									sourceMap: options.sourcemap,
									declaration: true,
									declarationDir: getDeclarationDir({ options, pkg }),
									jsx: 'preserve',
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
							jsxImportSource: options.jsxImportSource || false,
						},
					}),
					options.compress !== false && [
						terser({
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
						writeBundle(_, bundle) {
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
			name: options.name && options.name.replace(/^global\./, ''),
			extend: /^global\./.test(options.name),
			dir: outputDir,
			entryFileNames: outputEntryFileName,
			exports: 'auto',
		},
	};

	return config;
}
