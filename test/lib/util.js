import stripAnsi from 'strip-ansi';

export const strip = s =>
	stripAnsi(s).replace(/(?:^[\n\s]+|[\n\s]+$|(^|\n)\s+)/gm, '$1');
