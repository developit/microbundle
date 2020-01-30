import babelJest from 'babel-jest';
import { config } from './babel-custom';

const createTransformer = (options = {}) => {
	const babelConfig = config({}, { customOptions: { ...options, jest: true } });

	return babelJest.createTransformer(babelConfig);
};

module.exports = { createTransformer };
