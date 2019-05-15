const h = (tag, props, ...children) => ({ tag, props, children });
// eslint-disable-next-line no-unused-vars
const Fragment = ({ children }) => children;

export default class Foo {
	render() {
		return (
			<div id="app">
				<h1>Hello, World!</h1>
				<p>A JSX demo.</p>
				<>
					<p>Test fragment</p>
				</>
			</div>
		);
	}
}
