module.exports = {
	'{src,test}/**/*.js': fileNames =>
		fileNames
			.filter(fileName => !fileName.includes('/dist/'))
			.map(fileName => [`eslint --fix ${fileName}`, `git add ${fileName}`]),
	'*.md': ['prettier --write', 'git add'],
};
