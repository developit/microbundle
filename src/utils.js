import { promises as fs } from 'fs';
import camelCase from 'camelcase';

export const readFile = fs.readFile;

export const stat = fs.stat;

export function isDir(name) {
	return stat(name)
		.then(stats => stats.isDirectory())
		.catch(() => false);
}

export function isFile(name) {
	return stat(name)
		.then(stats => stats.isFile())
		.catch(() => false);
}

// eslint-disable-next-line no-console
export const stdout = console.log.bind(console);
export const stderr = console.error.bind(console);

export const isTruthy = obj => {
	if (!obj) {
		return false;
	}

	return obj.constructor !== Object || Object.keys(obj).length > 0;
};

/** Remove a @scope/ prefix from a package name string */
export const removeScope = name => name.replace(/^@.*\//, '');

const INVALID_ES3_IDENT = /((^[^a-zA-Z]+)|[^\w.-])|([^a-zA-Z0-9]+$)/g;

/**
 * Turn a package name into a valid reasonably-unique variable name
 * @param {string} name
 */
export function safeVariableName(name) {
	const normalized = removeScope(name).toLowerCase();
	const identifier = normalized.replace(INVALID_ES3_IDENT, '');
	return camelCase(identifier);
}

export const EXTENSION = /(\.(umd|cjs|es|m))?\.([cm]?[tj]sx?)$/;
