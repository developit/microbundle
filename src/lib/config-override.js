import { isFile } from '../utils';
import { resolve } from 'path';

function configOverrider(projectOverride, context) {
	return {
		/**
		 * Override the configuration for a given plugin.
		 *
		 * @param {string} pluginName
		 * @param {Object} config the
		 */
		pluginConfig(pluginName, config) {
			// No override if no plugins override is defined
			if (!projectOverride.plugins) {
				return config;
			}

			// Expect provided override to be a function returning modified config
			const override = projectOverride.plugins[pluginName];
			return override ? override(config, context) : config;
		},

		/**
		 * Override the full rollup config before it's used
		 *
		 * @param {Object} config
		 */
		config(config) {
			if (!projectOverride.config) {
				return config;
			}

			return projectOverride.config(config, context);
		},
	};
}

export async function getConfigOverride(context) {
	const path = resolve(context.options.cwd, 'microbundle.config.js');
	const hasProjectConfig = await isFile(path);

	return configOverrider(hasProjectConfig ? require(path) : {}, context);
}
