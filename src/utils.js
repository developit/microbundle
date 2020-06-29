import { promises as fs } from 'fs';

export const readFile = fs.readFile;

export const stat = fs.stat;

export const isDir = name =>
	stat(name)
		.then(stats => stats.isDirectory())
		.catch(() => false);

export const isFile = name =>
	stat(name)
		.then(stats => stats.isFile())
		.catch(() => false);

export const stdout = console.log.bind(console); // eslint-disable-line no-console

export const stderr = console.error.bind(console);

export const isTruthy = obj => {
	if (!obj) {
		return false;
	}

	return obj.constructor !== Object || Object.keys(obj).length > 0;
};
