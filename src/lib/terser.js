// Normalize Terser options from microbundle's relaxed JSON format (mutates argument in-place)
export function normalizeMinifyOptions(minifyOptions) {
	// ignore normalization if "mangle" is a boolean:
	if (typeof minifyOptions.mangle === 'boolean') return;

	const mangle = minifyOptions.mangle || (minifyOptions.mangle = {});
	let properties = mangle.properties;

	// allow top-level "properties" key to override mangle.properties (including {properties:false}):
	if (minifyOptions.properties != null) {
		properties = mangle.properties =
			minifyOptions.properties &&
			Object.assign(properties, minifyOptions.properties);
	}

	// allow previous format ({ mangle:{regex:'^_',reserved:[]} }):
	if (minifyOptions.regex || minifyOptions.reserved) {
		if (!properties) properties = mangle.properties = {};
		properties.regex = properties.regex || minifyOptions.regex;
		properties.reserved = properties.reserved || minifyOptions.reserved;
	}

	if (properties) {
		if (properties.regex) properties.regex = new RegExp(properties.regex);
		properties.reserved = [].concat(properties.reserved || []);
	}
}
