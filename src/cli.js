#!/usr/bin/env node

import sade from 'sade';
import microbundle from '.';

let { version } = require('../package');
let prog = sade('microbundle');

let toArray = val => Array.isArray(val) ? val : val == null ? [] : [val];

prog
	.version(version)
	.option('--entry, -i', 'Entry module(s)')
	.option('--output, -o', 'Directory to place build files into')
	.option('--format, -f', 'Only build specified formats', 'es,cjs,umd')
	.option('--target', 'Specify your target environment', 'node')
	.option('--external', `Specify external dependencies, or 'all'`)
	.option('--compress', 'Compress output using UglifyJS', true)
	.option('--strict', 'Enforce undefined global context and add "use strict"')
	.option('--name', 'Specify name exposed in UMD builds')
	.option('--cwd', 'Use an alternative working directory', '.');

prog
	.command('build [...entries]', '', { default: true })
	.describe('Build once and exit')
	.action(run);

prog
	.command('watch [...entries]')
	.describe('Rebuilds on any change')
	.action((str, opts) => run(str, opts, true));

// Parse argv; add extra aliases
prog.parse(process.argv, {
	alias: {
		o: ['output', 'd'],
		i: ['entry', 'entries', 'e']
	}
});

function run(str, opts, isWatch) {
	opts.watch = !!isWatch;
	opts.entries = toArray(str || opts.entry).concat(opts._);
	microbundle(opts)
		.then( output => {
			if (output!=null) process.stdout.write(output + '\n');
			if (!opts.watch) process.exit(0);
		})
		.catch(err => {
			process.stderr.write(String(err && err.message || err) + '\n');
			process.exit(err.code || 1);
		});
}
