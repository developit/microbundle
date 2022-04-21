import { basename } from 'path';
import { green, red, yellow, white } from 'kleur';
import gzipSize from 'gzip-size';
import brotliSize from 'brotli-size';
import prettyBytes from 'pretty-bytes';

function getPadLeft(str, width, char = ' ') {
	return char.repeat(width - str.length);
}

function formatSize(size, filename, type, raw) {
	const pretty = raw ? `${size} B` : prettyBytes(size);
	const color = size < 5000 ? green : size > 40000 ? red : yellow;
	const indent = getPadLeft(pretty, 13);
	return `${indent}${color(pretty)}: ${white(basename(filename))}.${type}`;
}

export async function getSizeInfo(code, filename, raw) {
	raw = raw || code.length < 5000;

	const [gzip, brotli] = await Promise.all([
		gzipSize(code).catch(() => null),
		brotliSize(code).catch(() => null),
	]);

	let out = formatSize(gzip, filename, 'gz', raw);
	if (brotli) {
		out += '\n' + formatSize(brotli, filename, 'br', raw);
	}

	return out;
}
