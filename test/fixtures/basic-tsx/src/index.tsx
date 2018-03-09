const h = (tag, props, ...children) => ({ tag, props, children });

export default class Foo {
	render() {
		return (
			<div id="app">
				<h1>Hello, World!</h1>
				<p>A JSX demo.</p>
			</div>
		);
	}
}
