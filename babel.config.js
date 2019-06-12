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
				exclude: ['transform-async-to-generator', 'transform-regenerator'],
			},
		],
	],
	plugins: ['@babel/plugin-syntax-jsx'],
};
