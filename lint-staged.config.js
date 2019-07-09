module.exports = {
	'{src,test}/**/*.js': [`eslint --fix`, `git add`],
	'*.md': ['prettier --write', 'git add'],
};
