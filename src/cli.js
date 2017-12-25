#!/usr/bin/env node

import sade from 'sade';
import microbundle from '.';

let { version } = require('../package');
let prog = sade('microbundle');

prog
	.version(version)
	.option('--cwd', 'Use an alternative working directory', '.')
	.option('--entry, -i', 'Entry module(s)')
	.option('--output, -o', 'Directory to place build files into')
	.option('--format, -f', 'Only build specified formats', 'es,cjs,umd')
	.option('--external', `Specify external dependencies, or 'all'`)
	.option('--compress', 'Compress output using UglifyJS', true)
	.option('--strict', 'Enforce undefined global context and add "use strict"')
	.option('--name', 'Specify name exposed in UMD builds');

prog
	.command('build [entries]', '', { default: true })
	.describe('Build once and exit')
	.action(run);

prog
	.command('watch [entries]')
	.describe('Rebuilds on any change')
	.action(opts => run(opts, true));

// Parse argv; add extra aliases
prog.parse(process.argv, {
	alias: {
		o: ['output', 'd'],
		i: ['entry', 'entries', 'e']
	}
});

function run(options, watch) {
	options.entries = options._;
	options.watch = watch===true;
	microbundle(options)
		.then( output => {
			if (output!=null) process.stdout.write(output + '\n');
			if (!watch) {
				process.exit(0);
			}
		})
		.catch(err => {
			process.stderr.write(String(err) + '\n');
			process.exit(err.code || 1);
		});
}
