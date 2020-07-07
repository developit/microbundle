/**
 * Convert booleans and int define= values to literals.
 * This is more intuitive than `microbundle --define A=1` producing A="1".
 */
export function toReplacementExpression(value, name) {
	// --define A="1",B='true' produces string:
	const matches = value.match(/^(['"])(.+)\1$/);
	if (matches) {
		return [JSON.stringify(matches[2]), name];
	}

	// --define @assign=Object.assign replaces expressions with expressions:
	if (name[0] === '@') {
		return [value, name.substring(1)];
	}

	// --define A=1,B=true produces int/boolean literal:
	if (/^(true|false|\d+)$/i.test(value)) {
		return [value, name];
	}

	// default: string literal
	return [JSON.stringify(value), name];
}

/**
 * Parses values of the form "$=jQuery,React=react" into key-value object pairs.
 */
export function parseMappingArgument(globalStrings, processValue) {
	const globals = {};
	globalStrings.split(',').forEach(globalString => {
		let [key, value] = globalString.split('=');
		if (processValue) {
			const r = processValue(value, key);
			if (r !== undefined) {
				if (Array.isArray(r)) {
					[value, key] = r;
				} else {
					value = r;
				}
			}
		}
		globals[key] = value;
	});
	return globals;
}

/**
 * Parses values of the form "$=jQuery,React=react" into key-value object pairs.
 * @param {string} aliasStrings
 * @return {{ find: string, replacement: string }[]}
 */
export function parseAliasArgument(aliasStrings) {
	return aliasStrings.split(',').map(str => {
		let [key, value] = str.split('=');
		return { find: key, replacement: value };
	});
}

/**
 *
 * @param {string} external
 * @param {Record<string, string>} peerDependencies
 * @param {Record<string, string>} dependencies
 * @return {Array<string|RegExp>}
 */
export function parseExternals(
	external,
	peerDependencies = {},
	dependencies = {},
) {
	if (external === 'none') {
		return [];
	}

	const peerDeps = Object.keys(peerDependencies);
	if (external) {
		/** @type {Array<string|RegExp>} */
		const externals = [].concat(peerDeps).concat(
			// CLI --external supports regular expressions:
			external.split(',').map(str => new RegExp(str)),
		);

		return externals;
	}

	return peerDeps.concat(Object.keys(dependencies));
}
