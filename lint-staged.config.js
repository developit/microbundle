module.exports = {
	linters: {
		'{src,test}/**/*.js': ['eslint --fix', 'git add'],
		'*.md': ['prettier --write', 'git add'],
	},
	ignore: ['**/dist/**/*.js'],
};
