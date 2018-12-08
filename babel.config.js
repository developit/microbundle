module.exports = {
	presets: [
		[
			'@babel/preset-env',
			{
				loose: true,
				modules: process.env.BABEL_ENV === 'test' ? 'commonjs' : 'auto',
				targets: {
					node: 'current',
				},
			},
		],
	],
	plugins: ['@babel/plugin-syntax-jsx'],
};
