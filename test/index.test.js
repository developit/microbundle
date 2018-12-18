import { resolve } from 'path';
import fs from 'fs-extra';
import { promisify } from 'es6-promisify';
import dirTree from 'directory-tree';
import shellQuote from 'shell-quote';
import _rimraf from 'rimraf';
import { strip } from './lib/util';
import { readFile } from '../src/utils';
import createProg from '../src/prog';
import microbundle from '../src/index';

const rimraf = promisify(_rimraf);

const FIXTURES_DIR = `${__dirname}/fixtures`;
const DEFAULT_SCRIPT = 'microbundle';

const times = (n, fn) => Array.from({ length: n }).map(i => fn(i));
const join = (arr, delimiter = '') => arr.join(delimiter);
const constant = konst => () => konst;

const printTree = (nodes, indentLevel = 0) => {
	const indent = join(times(indentLevel, constant('  ')));
	return join(
		nodes
			.filter(node => node.name[0] !== '.')
			.map(
				node =>
					`${indent}${node.name}\n${
						node.type === 'directory'
							? printTree(node.children, indentLevel + 1)
							: ''
					}`,
			),
	);
};

const parseScript = (() => {
	let parsed;
	const prog = createProg(_parsed => (parsed = _parsed));
	return script => {
		const argv = shellQuote.parse(`node ${script}`);
		// assuming {op: 'glob', pattern} for non-string args
		prog(argv.map(arg => (typeof arg === 'string' ? arg : arg.pattern)));
		return parsed;
	};
})();

describe('fixtures', () => {
	fs.readdirSync(FIXTURES_DIR).forEach(fixtureDir => {
		const fixturePath = resolve(FIXTURES_DIR, fixtureDir);

		if (!fs.statSync(fixturePath).isDirectory()) {
			return;
		}

		it(fixtureDir, async () => {
			await rimraf(resolve(`${fixturePath}/dist`));

			let script;
			try {
				({ scripts: { build: script } = {} } = JSON.parse(
					await readFile(resolve(fixturePath, 'package.json'), 'utf8'),
				));
			} catch (err) {}
			script = script || DEFAULT_SCRIPT;

			const prevDir = process.cwd();
			process.chdir(resolve(fixturePath));

			const parsedOpts = parseScript(script);

			const output = await microbundle({
				...parsedOpts,
				cwd: parsedOpts.cwd !== '.' ? parsedOpts.cwd : resolve(fixturePath),
			});

			process.chdir(prevDir);

			const printedDir = printTree([dirTree(fixturePath)]);

			expect(
				[
					`Used script: ${script}`,
					'Directory tree:',
					printedDir,
					strip(output),
				].join('\n\n'),
			).toMatchSnapshot();
		});
	});

	it('should keep shebang', () => {
		expect(
			fs
				.readFileSync(resolve(FIXTURES_DIR, 'shebang/dist/shebang.js'), 'utf8')
				.startsWith('#!'),
		).toEqual(true);
	});

	it('should keep named and default export', () => {
		const mod = require(resolve(
			FIXTURES_DIR,
			'default-named/dist/default-named.js',
		));

		expect(Object.keys(mod)).toEqual(['foo', 'default']);
	});
});
