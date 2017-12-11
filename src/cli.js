#!/usr/bin/env node

import yargs from 'yargs';
import microbundle from '.';

yargs
	.option('entry', {
		type: 'string',
		alias: ['i', 'e', 'entries'],
		description: 'Entry module(s)',
		defaultDescription: '<package.module>'
	})
	.option('output', {
		type: 'string',
		alias: ['o', 'd'],
		description: 'Directory to place build files into',
		defaultDescription: '<dirname(package.main), build/>'
	})
	.option('cwd', {
		type: 'string',
		description: 'Use an alternative working directory',
		defaultDescription: '.'
	})
	.option('format', {
		type: 'string',
		description: 'Only build specified formats',
		defaultDescription: 'es,cjs,umd'
	})
	.option('compress', {
		type: 'boolean',
		description: 'Compress output using UglifyJS',
		default: true
	})
	.option('strict', {
		description: 'Enforce undefined global context and add "use strict"',
		default: false
	})
	.command(
		['build [entries..]', '$0 [entries..]'],
		'Build once and exit',
		() => {},
		argv => run(argv, false)
	)
	.command(
		'watch [entries..]',
		'Rebuilds on any change',
		() => {},
		argv => run(argv, true)
	)
	.help()
	.argv;

function run(options, watch) {
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
