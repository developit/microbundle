module.exports = {
	linters: {
		'{src,test}/**/*.js': [
			'prettier --use-tabs --single-quote --trailing-comma=all --write',
			'eslint --fix',
			'git add',
		],
		'*.md': ['prettier --write', 'git add'],
	},
	ignore: ['**/dist/**/*.js'],
};
