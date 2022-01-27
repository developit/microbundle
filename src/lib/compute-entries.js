import { resolve, relative, dirname, join, basename, sep, posix } from 'path';
import { yellow } from 'kleur';
import { stderr } from '../utils';

function replaceName(filename, name) {
	if (!filename) return filename;
	const ext = (basename(filename).match(
		/(?:\.(?:umd|cjs|esm|es|m|mjs|module|modern))?\.(?:[mc]js|[tj]sx?)$/i,
	) || [])[0];
	const dir = dirname(filename);
	const rel = relative(dir, name);
	return ensureRelative(
		// join(dirname(filename), name + basename(filename).replace(/^[^.]+/, '')),
		join(dir, rel + ext),
	);
}

function ensureRelative(path) {
	if (path[0] !== '.') return './' + path;
	return path;
}

/**
 * @param {object} options
 * @param {object} options.pkg - parsed package.json object
 * @param {string} options.entry - the entry filename to produce a mapping for
 * @param {string[]} options.entries - all entries to be compiled
 * @param {boolean} [options.multipleEntries=false] - `true` if multiple entries are to be compiled
 * @param {string} [options.output=''] - output filename (?)
 * @param {string} [options.cwd='.']
 */
export function computeEntries(options) {
	const { pkg } = options;
	const cwd = options.cwd || '.';
	const entry = ensureRelative(relative(cwd, resolve(cwd, options.entry)));

	// package.json export name (see https://nodejs.org/api/packages.html#packages_subpath_exports)
	let exportPath = '.';
	let mainNoExtension = ensureRelative(
		options.output || pkg.main || 'dist/index.js',
	);
	const entries = options.entries.map(p => relative(cwd, resolve(cwd, p)));
	let isDefaultEntry = true;
	if (options.multipleEntries) {
		const defaultEntry = ensureRelative(
			entries.find(p => basename(p).match(/^index\.([mc]js|[tj]sx?)$/i)) ||
				entries[0],
		);
		isDefaultEntry = defaultEntry === entry;
		// isDefaultEntry = entry.match(
		// 	/([\\/])index(\.(umd|cjs|es|m))?\.(mjs|cjs|[tj]sx?)$/,
		// );
		const commonDir = entries
			.reduce((acc, entry) => {
				let parts = dirname(entry).split(sep);
				if (parts.length < acc.length) acc.length = parts.length;
				let last = parts.length - 1;
				while (parts[last] !== acc[last]) {
					last--;
					acc.pop();
				}
				return acc;
			}, dirname(entries[0]).split(sep))
			.join(sep);

		let name = isDefaultEntry ? mainNoExtension : entry;
		mainNoExtension = ensureRelative(
			posix.relative(
				cwd,
				resolve(cwd, dirname(mainNoExtension), basename(name)),
			),
		);
		if (!isDefaultEntry) {
			exportPath = ensureRelative(
				posix.relative(commonDir, entry.replace(/\.([mc]js|[tj]sx?)$/g, '')),
			);
		}
		// console.log('>>>>>', entry, { name, commonDir, defaultEntry });
	}
	mainNoExtension = mainNoExtension.replace(
		/(\.(umd|cjs|es|m|module|modern))?\.([mc]js|[tj]sx?)$/i,
		'',
	);

	const mainsByFormat = {};

	let cjsExt = pkg.type === 'module' ? '.cjs' : '.js';
	let esmExt = pkg.type === 'module' ? '.esm.js' : '.mjs';

	const MJS = pkg.type === 'module' ? /\.m?js$/i : /\.mjs$/i;
	const CJS = pkg.type === 'module' ? /\.cjs$/i : /\.js$/i;
	const UMD = /[.-]umd\.c?js$/i;

	const CONDITIONS_MJS = ['import', 'module', 'default'];
	const CONDITIONS_MODERN = ['modern', 'esmodules', ...CONDITIONS_MJS];
	const CONDITIONS_CJS = ['require', 'default'];
	const CONDITIONS_UMD = ['umd', 'default'];

	const anyMain = walk(pkg.exports, exportPath, [
		...CONDITIONS_MODERN,
		'require',
		'umd',
	]);
	if (anyMain) {
		mainNoExtension = anyMain.replace(
			/(\.(umd|cjs|esm?|m|module|modern|20\d\d))?\.([mc]js|[tj]sx?)$/i,
			'',
		);
	}

	mainsByFormat.modern =
		walk(pkg.exports, exportPath, CONDITIONS_MODERN, MJS) ||
		(pkg.syntax && pkg.syntax.esmodules) ||
		pkg.esmodule ||
		replaceName('x.modern.js', mainNoExtension);
	if (mainsByFormat.modern) {
		const m = mainsByFormat.modern.match(/(\.esm?|\.module|\.m)?\.m?js$/);
		if (m) esmExt = m[0];
	}

	mainsByFormat.es = walk(pkg.exports, exportPath, CONDITIONS_MJS, MJS);
	// if (mainsByFormat.es === mainsByFormat.modern) {
	// 	mainsByFormat.es = walk(pkg.exports, exportPath, ['module'], MJS);
	// }
	if (!mainsByFormat.es || mainsByFormat.es === mainsByFormat.modern) {
		mainsByFormat.es =
			pkg.module && !pkg.module.match(/src\//)
				? replaceName(pkg.module, mainNoExtension)
				: replaceName(pkg['jsnext:main'], mainNoExtension) ||
				  replaceName('x.esm' + esmExt, mainNoExtension);
	}

	mainsByFormat.umd =
		walk(pkg.exports, exportPath, CONDITIONS_UMD, UMD) ||
		pkg['umd:main'] ||
		pkg.unpkg ||
		replaceName('x.umd' + cjsExt, mainNoExtension);

	mainsByFormat.cjs = walk(pkg.exports, exportPath, CONDITIONS_CJS, CJS);
	if (!mainsByFormat.cjs || mainsByFormat.cjs === mainsByFormat.umd) {
		mainsByFormat.cjs =
			pkg['cjs:main'] ||
			(isDefaultEntry && pkg.main) ||
			replaceName('x' + cjsExt, mainNoExtension);
	}

	// const anyMain = mainsByFormat.es || mainsByFormat.cjs || mainsByFormat.umd;
	// if (anyMain) {
	// 	mainNoExtension = anyMain.replace(
	// 		/(\.(umd|cjs|esm?|m|module|modern|20\d\d))?\.([mc]js|[tj]sx?)$/i,
	// 		'',
	// 	);
	// }
	// if (!mainsByFormat.es || mainsByFormat.es === mainsByFormat.modern) {
	// 	mainsByFormat.es =
	// 		pkg.module && !pkg.module.match(/src\//)
	// 			? pkg.module
	// 			: pkg['jsnext:main'] || replaceName('x.esm.js', mainNoExtension);
	// }

	if (pkg.type === 'module') {
		let errors = [];
		let filenames = [];
		if (mainsByFormat.cjs.endsWith('.js')) {
			errors.push('CommonJS');
			filenames.push(`  "cjs:main": "${mainsByFormat.cjs}",`);
		}
		if (mainsByFormat.umd.endsWith('.js')) {
			errors.push('CommonJS');
			const field = pkg['umd:main'] ? 'umd:main' : 'unpkg';
			filenames.push(`  "${field}": "${mainsByFormat.umd}",`);
		}
		if (errors.length) {
			const warning =
				`Warning: A package.json with {"type":"module"} should use .cjs file extensions for` +
				` ${errors.join(' and ')} filename${errors.length == 1 ? '' : 's'}:` +
				`\n${filenames.join('\n')}`;
			stderr(yellow(warning));
		}
	}

	return mainsByFormat;
}

/**
 * @param {any} exports - package.json "exports" field value
 * @param {string} exportPath - the export to look up (eg: '.', './a', './b/c')
 * @param {string[]} conditions - conditional export keys to use (note: unlike in resolution, order here *does* define precedence!)
 * @param {RegExp|string} [defaultPattern] - only use (resolved) default export filenames that match this pattern
 * @param {string} [condition] - (internal) the nearest condition key on the stack
 */
function walk(
	exports,
	exportPath,
	conditions,
	defaultPattern,
	condition = 'default',
) {
	if (!exports) return;
	if (typeof exports === 'string') {
		if (
			condition === 'default' &&
			defaultPattern &&
			!exports.match(defaultPattern)
		) {
			return;
		}
		return exports;
	}
	if (Array.isArray(exports)) {
		for (const map of exports) {
			const r = walk(map, exportPath, conditions, defaultPattern, condition);
			if (r) return r;
		}
		return;
	}
	const map = exports[exportPath];
	if (map) {
		const r = walk(map, exportPath, conditions, defaultPattern, condition);
		if (r) return r;
	}
	for (const condition of conditions) {
		const map = exports[condition];
		if (!map) continue;
		const r = walk(map, exportPath, conditions, defaultPattern, condition);
		if (r) return r;
	}
}
