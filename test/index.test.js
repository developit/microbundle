import { resolve } from 'path';
import fs from 'fs-extra';
import dirTree from 'directory-tree';
import { strip } from './lib/util';
import { buildDirectory, getBuildScript } from '../tools/build-fixture';

const FIXTURES_DIR = `${__dirname}/fixtures`;
const DEFAULT_SCRIPT = 'microbundle';
const TEST_TIMEOUT = 11000;

const sleep = ms => new Promise(r => setTimeout(r, ms));

const join = (arr, delimiter = '') => arr.join(delimiter);

const printTree = (nodes, indentLevel = 0) => {
	const indent = '  '.repeat(indentLevel);
	return join(
		nodes
			.filter(node => node.name[0] !== '.')
			.map(node => {
				const isDir = node.type === 'directory';
				return `${indent}${node.name}\n${
					isDir ? printTree(node.children, indentLevel + 1) : ''
				}`;
			}),
	);
};

describe('fixtures', () => {
	const dirs = fs
		.readdirSync(FIXTURES_DIR)
		.filter(fixturePath =>
			fs.statSync(resolve(FIXTURES_DIR, fixturePath)).isDirectory(),
		);

	it.each(dirs)(
		'build %s with microbundle',
		async fixtureDir => {
			let fixturePath = resolve(FIXTURES_DIR, fixtureDir);
			if (fixtureDir.endsWith('-with-cwd')) {
				fixturePath = resolve(fixturePath, fixtureDir.replace('-with-cwd', ''));
			}

			await sleep(1);

			const output = await buildDirectory(fixtureDir);

			await sleep(1);

			const printedDir = printTree([dirTree(fixturePath)]);

			expect(
				[
					`Used script: ${await getBuildScript(fixturePath, DEFAULT_SCRIPT)}`,
					'Directory tree:',
					printedDir,
					strip(output),
				].join('\n\n'),
			).toMatchSnapshot();

			const dist = resolve(`${fixturePath}/dist`);
			const files = fs.readdirSync(resolve(dist));
			expect(files.length).toMatchSnapshot();
			// we don't really care about the content of a sourcemap
			files
				.filter(
					file =>
						!/\.map$/.test(file) &&
						!fs.lstatSync(resolve(dist, file)).isDirectory(),
				)
				.sort(file => (/modern/.test(file) ? 1 : 0))
				.forEach(file => {
					expect(
						fs.readFileSync(resolve(dist, file)).toString('utf8'),
					).toMatchSnapshot();
				});

			// TypeScript declaration files
			const types = resolve(`${fixturePath}/types`);
			if (fs.existsSync(types)) {
				const declarations = fs.readdirSync(types);
				expect(declarations.length).toMatchSnapshot();
				declarations.forEach(file => {
					expect(
						fs.readFileSync(resolve(types, file)).toString('utf8'),
					).toMatchSnapshot();
				});
			}
		},
		TEST_TIMEOUT,
	);

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

		expect(Object.keys(mod)).toEqual(['default', 'foo']);
	});
});
