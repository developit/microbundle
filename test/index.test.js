import path from 'path';
import fs from 'fs-extra';
import dirTree from 'directory-tree';
import { strip } from './lib/util';
import microbundle from '../src/index';

const FIXTURES_DIR = `${__dirname}/fixtures`;

const times = (n, fn) => Array.from({ length: n }).map(i => fn(i));
const join = (arr, delimiter = '') => arr.join(delimiter);
const constant = konst => () => konst;

const printTree = (nodes, indentLevel = 0) => {
	const indent = join(times(indentLevel, constant('  ')));
	return join(nodes.filter(node => node.name[0] !== '.').map(node =>
		`${indent}${node.name}\n${node.type === 'directory' ? printTree(node.children, indentLevel + 1) : ''}`
	));
};

describe('fixtures', () => {
	fs.readdirSync(FIXTURES_DIR).forEach(fixtureDir => {
		const fixturePath = path.resolve(path.join(FIXTURES_DIR, fixtureDir));

		if (!fs.statSync(fixturePath).isDirectory()) {
			return;
		}

		it(fixtureDir, async () => {
			const prevDir = process.cwd();
			process.chdir(path.resolve(fixturePath));
			const output = await microbundle({
				cwd: path.resolve(fixturePath),
				formats: 'es,cjs,umd'
			});
			process.chdir(prevDir);

			const printedDir = printTree([dirTree(fixturePath)]);

			expect(`${printedDir}\n\n${strip(output)}`).toMatchSnapshot();
		});
	});
});
