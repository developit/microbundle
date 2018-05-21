#!/usr/bin/env node
import chalk from 'chalk';
import microbundle from '.';
import prog from './prog';
import { stdout, stderr } from './utils';

const run = opts => {
	microbundle(opts)
		.then(output => {
			if (output != null) stdout(output);
			if (!opts.watch) process.exit(0);
		})
		.catch(err => {
			process.exitCode = (typeof err.code === 'number' && err.code) || 1;

			const error = err.error || err;
			const description = `${
				error.name ? error.name + ': ' : ''
			}${error.message || error}`;
			const message = error.plugin
				? `(${error.plugin} plugin) ${description}`
				: description;

			stderr(chalk.bold.red(message));

			if (error.loc) {
				stderr();
				stderr(`at ${error.loc.file}:${error.loc.line}:${error.loc.column}`);
			}

			if (error.frame) {
				stderr();
				stderr(chalk.dim(error.frame));
			} else if (err.stack) {
				const headlessStack = error.stack.replace(message, '');
				stderr(chalk.dim(headlessStack));
			}

			stderr();
			process.exit();
		});
};

prog(run)(process.argv);
