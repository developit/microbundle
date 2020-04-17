// eslint-ignore
require = require('esm')(module);

const { resolve } = require('path');
const fs = require('fs-extra');
const { buildDirectory } = require('./build-fixture');

const FIXTURES_DIR = `${__dirname}/../test/fixtures`;

const each = fn => arr => {
	arr = Array.isArray(arr) ? arr : [arr];

	return arr
		.reduce(
			(prev, curr, i) => prev.then(() => fn(curr, i, arr.length)),
			Promise.resolve(),
		)
		.then(() => arr);
};

const dirs = fs
	.readdirSync(FIXTURES_DIR)
	.filter(fixturePath =>
		fs.statSync(resolve(FIXTURES_DIR, fixturePath)).isDirectory(),
	);

(async () => {
	const csv = [];

	await each(async fixtureDir => {
		let fixturePath = resolve(FIXTURES_DIR, fixtureDir);
		if (fixtureDir.endsWith('-with-cwd')) {
			fixturePath = resolve(fixturePath, fixtureDir.replace('-with-cwd', ''));
		}

		await buildDirectory(fixtureDir);

		const dist = resolve(`${fixturePath}/dist`);
		fs.readdirSync(dist)
			.filter(file => !/\.map$/.test(file))
			.forEach(file => {
				const size = fs.statSync(resolve(`${dist}/${file}`)).size;
				csv.push(`${fixtureDir}/${file},${size}`);
			});
	})(dirs);

	csv.unshift('file,size');

	fs.writeFile(resolve(__dirname, '../sizes.csv'), csv.join('\n'));
})();
