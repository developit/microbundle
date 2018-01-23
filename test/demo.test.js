import path from 'path';
import fs from 'fs-extra';
import { strip } from './lib/util';
import microbundle from '../src/index';

describe('demo', () => {
	it('should produce build files', async () => {
		let output = await microbundle({
			cwd: path.resolve(__dirname, 'fixtures/demo'),
			formats: 'es,cjs,umd'
		});

		expect(strip(output)).toEqual(strip(`
			Build output to dist:
			225 B: demo.js
			225 B: demo.m.js
			295 B: demo.umd.js
		`));

		let dist = await fs.readdir(path.resolve(__dirname, 'fixtures/demo/dist'));

		expect(dist).toEqual([
			'demo.js',
			'demo.js.map',
			'demo.m.js',
			'demo.m.js.map',
			'demo.umd.js',
			'demo.umd.js.map'
		]);
	});
});
