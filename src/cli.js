#!/usr/bin/env node
import microbundle from '.';
import prog from './prog';

const run = opts => {
	microbundle(opts)
		.then( output => {
			if (output!=null) process.stdout.write(output + '\n');
			if (!opts.watch) process.exit(0);
		})
		.catch(err => {
			process.stderr.write(String(err) + '\n');
			process.exit(err.code || 1);
		});
};

prog(run)(process.argv);
