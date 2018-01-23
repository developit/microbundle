import path from 'path';
import fs from 'fs-extra';
import { strip } from './lib/util';
import microbundle from '../src/index';

describe('ts-demo', () => {
	it('should produce build files', async () => {
		let output = await microbundle({
			cwd: path.resolve(__dirname, 'fixtures/ts-demo'),
			formats: 'es,cjs,umd'
		});

		expect(strip(output)).toEqual(strip(`
			Build output to dist:
			106 B: ts-demo.js
			106 B: ts-demo.m.js
			175 B: ts-demo.umd.js
		`));

		let dist = await fs.readdir(path.resolve(__dirname, 'fixtures/ts-demo/dist'));

		expect(dist).toEqual([
			'ts-demo.js',
			'ts-demo.js.map',
			'ts-demo.m.js',
			'ts-demo.m.js.map',
			'ts-demo.umd.js',
			'ts-demo.umd.js.map'
		]);
	});
});
