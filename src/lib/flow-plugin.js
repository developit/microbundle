import flow from 'rollup-plugin-flow';

export default function fixedFlow(options) {
	let plugin = flow(options);
	return Object.assign({}, plugin, {
		transform(code, id) {
			let ret = plugin.transform(code, id);
			if (ret && ret.code === code) return null;
			return ret;
		},
	});
}
