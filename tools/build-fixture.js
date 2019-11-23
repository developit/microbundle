import { resolve } from 'path';
import { promisify } from 'es6-promisify';
import shellQuote from 'shell-quote';
import _rimraf from 'rimraf';
import { exec as _exec } from 'child_process';
import { readFile } from '../src/utils';
import createProg from '../src/prog';
import microbundle from '../src/index';

const exec = promisify(_exec);
const rimraf = promisify(_rimraf);

const FIXTURES_DIR = resolve(`${__dirname}/../test/fixtures`);
const DEFAULT_SCRIPT = 'microbundle';

const parseScript = (() => {
	return script => {
		let parsed;
		const prog = createProg(_parsed => (parsed = _parsed));
		const argv = shellQuote.parse(`node ${script}`);

		// default to non-modern formats
		let hasFormats = argv.some(arg => /^(--format|-f)$/.test(arg));
		if (!hasFormats) argv.push('-f', 'es,cjs,umd');

		// assuming {op: 'glob', pattern} for non-string args
		prog(argv.map(arg => (typeof arg === 'string' ? arg : arg.pattern)));

		return parsed;
	};
})();

const getPackageJson = async (fixturePath) => {
	let pkg = {};
	try {
		pkg = JSON.parse(
			await readFile(resolve(fixturePath, 'package.json'), 'utf8'),
		);
	} catch (err) {
		if (err.code !== 'ENOENT') throw err;
	}
	return pkg;
};

export const getBuildScript = async (fixturePath, defaultScript) => {
	const pkg = await getPackageJson(fixturePath);
	return (pkg && pkg.scripts && pkg.scripts.build) || defaultScript;
};

export const getPostBuildScript = async fixturePath => {
	const pkg = await getPackageJson(fixturePath);
	return pkg && pkg.scripts && pkg.scripts.postbuild;
};

export const buildDirectory = async fixtureDir => {
	let fixturePath = resolve(FIXTURES_DIR, fixtureDir);
	if (fixtureDir.endsWith('-with-cwd')) {
		fixturePath = resolve(fixturePath, fixtureDir.replace('-with-cwd', ''));
	}

	const dist = resolve(`${fixturePath}/dist`);
	// clean up
	await rimraf(dist);
	await rimraf(resolve(`${fixturePath}/.rts2_cache_cjs`));
	await rimraf(resolve(`${fixturePath}/.rts2_cache_es`));
	await rimraf(resolve(`${fixturePath}/.rts2_cache_umd`));

	const script = await getBuildScript(fixturePath, DEFAULT_SCRIPT);

	const prevDir = process.cwd();
	process.chdir(resolve(fixturePath));

	const parsedOpts = parseScript(script);
	let output = '';
	output = await microbundle({
		...parsedOpts,
		cwd: parsedOpts.cwd !== '.' ? parsedOpts.cwd : resolve(fixturePath),
	});

	const postBuildScript = await getPostBuildScript(fixturePath);
	if (postBuildScript) {
		await exec(postBuildScript);
	}

	process.chdir(prevDir);

	return output;
};
