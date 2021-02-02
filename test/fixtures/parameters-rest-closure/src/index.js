export function parametersRestWithClosure(fn, ...args) {
	return function () {
		fn(...args);
	};
}
