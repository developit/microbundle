import sade from 'sade';
let { version } = require('../package');

const toArray = val => (Array.isArray(val) ? val : val == null ? [] : [val]);

export default handler => {
	const ENABLE_MODERN = process.env.MICROBUNDLE_MODERN !== 'false';

	const DEFAULT_FORMATS = ENABLE_MODERN ? 'modern,es,cjs,umd' : 'es,cjs,umd';

	const cmd = type => (str, opts) => {
		opts.watch = opts.watch || type === 'watch';
		opts.compress =
			opts.compress != null ? opts.compress : opts.target !== 'node';
		opts.entries = toArray(str || opts.entry).concat(opts._);
		handler(opts);
	};

	let prog = sade('microbundle');

	prog
		.version(version)
		.option('--entry, -i', 'Entry module(s)')
		.option('--output, -o', 'Directory to place build files into')
		.option(
			'--format, -f',
			`Only build specified formats (any of ${DEFAULT_FORMATS} or iife)`,
			DEFAULT_FORMATS,
		)
		.option('--watch, -w', 'Rebuilds on any change', false)
		.option(
			'--pkg-main',
			'Outputs files analog to package.json main entries',
			true,
		)
		.option('--target', 'Specify your target environment (node or web)', 'web')
		.option('--external', `Specify external dependencies, or 'none'`)
		.option('--globals', `Specify globals dependencies, or 'none'`)
		.example('microbundle --globals react=React,jquery=$')
		.option('--define', 'Replace constants with hard-coded values')
		.example('microbundle --define API_KEY=1234')
		.option('--alias', `Map imports to different modules`)
		.example('microbundle --alias react=preact')
		.option('--compress', 'Compress output using Terser', null)
		.option('--strict', 'Enforce undefined global context and add "use strict"')
		.option('--name', 'Specify name exposed in UMD builds')
		.option('--cwd', 'Use an alternative working directory', '.')
		.option('--sourcemap', 'Generate source map', true)
		.option(
			'--css-modules',
			'Turns on css-modules for all .css imports. Passing a string will override the scopeName. eg --css-modules="_[hash]"',
			null,
		)
		.example("microbundle --no-sourcemap # don't generate sourcemaps")
		.option('--raw', 'Show raw byte size', false)
		.option(
			'--jsx',
			'A custom JSX pragma like React.createElement (default: h)',
		)
		.option('--tsconfig', 'Specify the path to a custom tsconfig.json')
		.example('microbundle build --tsconfig tsconfig.build.json');

	prog
		.command('build [...entries]', '', { default: true })
		.describe('Build once and exit')
		.action(cmd('build'));

	prog
		.command('watch [...entries]')
		.describe('Rebuilds on any change')
		.action(cmd('watch'));

	// Parse argv; add extra aliases
	return argv =>
		prog.parse(argv, {
			alias: {
				o: ['output', 'd'],
				i: ['entry', 'entries', 'e'],
				w: ['watch'],
			},
		});
};
