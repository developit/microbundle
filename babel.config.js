module.exports = {
	presets: [
		[
			'@babel/preset-env',
			{
				loose: true,
				targets: {
					node: 'current',
				},
			},
		],
	],
	plugins: ['@babel/plugin-syntax-jsx'],
};
