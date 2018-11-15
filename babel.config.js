module.exports = {
	presets: [
		[
			'@babel/preset-env',
			{
				exclude: [
					'transform-async-to-generator',
					'proposal-async-generator-functions',
					'transform-regenerator',
				],
				loose: true,
				targets: {
					chrome: '58',
					ie: '11',
				},
			},
		],
	],
	plugins: [
		['babel-plugin-transform-async-to-promises', { inlineHelpers: true }],
		'@babel/plugin-syntax-jsx',
	],
};
