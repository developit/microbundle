export function parametersRestWithClosure(fn, ...args) {
	return function () {
		fn(...args);
	};
}

export function parametersRestWithInnerArrowFunction(fn, ...args) {
	return () => {
		fn(...args);
	};
}
