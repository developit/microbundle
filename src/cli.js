#!/usr/bin/env node

import microbundle from '.';
import prog from './prog';
import { stdout } from './utils';
import logError from './log-error';

const run = opts => {
	microbundle(opts)
		.then(output => {
			if (output != null) stdout(output);
			if (!opts.watch) process.exit(0);
		})
		.catch(err => {
			process.exitCode = (typeof err.code === 'number' && err.code) || 1;
			logError(err);
			process.exit();
		});
};

prog(run)(process.argv);
