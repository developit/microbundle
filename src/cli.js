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
			process.stderr.write(String(err.error || err) + '\n');
			if (typeof(err.code) === 'string') {
				process.stderr.write('error ' + err.code);
				process.exit(1);
			}
			else {
				process.exit(err.code || 1);
			}
		});
};

prog(run)(process.argv);
