export function shouldCssModules(options) {
	const passedInOption = processCssmodulesArgument(options);

	// We should module when my-file.module.css or my-file.css
	const moduleAllCss = passedInOption === true;

	// We should module when my-file.module.css
	const allowOnlySuffixModule = passedInOption === null;

	return moduleAllCss || allowOnlySuffixModule;
}

export function cssModulesConfig(options) {
	const passedInOption = processCssmodulesArgument(options);
	const isWatchMode = options.watch;
	const hasPassedInScopeName = !(
		typeof passedInOption === 'boolean' || passedInOption === null
	);

	if (shouldCssModules(options) || hasPassedInScopeName) {
		let generateScopedName = isWatchMode
			? '_[name]__[local]__[hash:base64:5]'
			: '_[hash:base64:5]';

		if (hasPassedInScopeName) {
			generateScopedName = passedInOption; // would be the string from --css-modules "_[hash]".
		}

		return { generateScopedName };
	}

	return false;
}

/**
 * This is done because if you use the cli default property, you get a primiatve "null" or "false",
 * but when using the cli arguments, you always get back strings. This method aims at correcting those
 * for both realms. So that both realms _convert_ into primatives.
 */
function processCssmodulesArgument(options) {
	if (options['css-modules'] === 'true' || options['css-modules'] === true)
		return true;
	if (options['css-modules'] === 'false' || options['css-modules'] === false)
		return false;
	if (options['css-modules'] === 'null' || options['css-modules'] === null)
		return null;

	return options['css-modules'];
}
