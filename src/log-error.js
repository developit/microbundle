import { red, dim } from 'kleur';
import { stderr } from './utils';

export default function(err) {
	const error = err.error || err;
	const description = `${error.name ? error.name + ': ' : ''}${error.message ||
		error}`;
	const message = error.plugin
		? `(${error.plugin} plugin) ${description}`
		: description;

	stderr(red().bold(message));

	if (error.loc) {
		stderr();
		stderr(`at ${error.loc.file}:${error.loc.line}:${error.loc.column}`);
	}

	if (error.frame) {
		stderr();
		stderr(dim(error.frame));
	} else if (err.stack) {
		const headlessStack = error.stack.replace(message, '');
		stderr(dim(headlessStack));
	}

	stderr();
}
