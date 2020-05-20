const createElement = (tag, props, ...children) => ({ tag, props, children });
// eslint-disable-next-line no-unused-vars
const Fragment = ({ children }) => children;

const React = {
	createElement,
	Fragment,
};

export const foo = <>foo</>;
