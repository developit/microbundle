<p align="center">
  <img src="https://i.imgur.com/LMEgZMh.gif" width="597" alt="microbundle">
</p>
<h1 align="center">
	Microbundle
	<a href="https://www.npmjs.org/package/microbundle"><img src="https://img.shields.io/npm/v/microbundle.svg?style=flat" alt="npm"></a> <a href="https://travis-ci.org/developit/microbundle"><img src="https://travis-ci.org/developit/microbundle.svg?branch=master" alt="travis"></a>
</h1>
<p align="center">The <strong>zero-configuration</strong> bundler for <em>tiny modules</em>, powered by <a href="https://github.com/rollup/rollup">Rollup</a>.</p>

---

## ✨ Features:

- **One dependency** to bundle your library using only a `package.json`
- Support for ESnext & async/await _(via [Bublé] & [async-to-promises])_
- Produces tiny, optimized code for all inputs
- Supports multiple entry modules _(`cli.js` + `index.js`, etc)_
- Creates multiple output formats for each entry _(<abbr title="CommonJS (node)">CJS</abbr>, <abbr title="Universal Module Definition">UMD</abbr> & <abbr title="ECMAScript Modules">ESM</abbr>)_
- 0 configuration TypeScript support
- Built-in Terser compression & gzipped bundle size tracking

## 🔧 Installation

### Download

`npm i -D microbundle`

### Set up your `package.json`

```js
{
  "source": "src/foo.js",         // Your source file (same as 1st arg to microbundle)
  "main": "dist/foo.js",        // output path for CommonJS/Node
  "module": "dist/foo.mjs",     // output path for JS Modules
  "unpkg": "dist/foo.umd.js",   // optional, for unpkg.com
  "scripts": {
    "build": "microbundle",       // uses "source" and "main" as input and output paths by default
    "dev": "microbundle watch"
  }
}
```

### New: Modern JS

Microbundle now has a new `modern` format (`microbundle -f modern`).
Modern output still bundles and compresses your code, but it keeps useful syntax
around that actually helps compression:

```js
// Our source, "src/make-dom.js":
export default async function makeDom(tag, props, children) {
	const el = document.createElement(tag);
	el.append(...(await children));
	return Object.assign(el, props);
}
```

Microbundle compiles the above to this:

```js
export default async (e, t, a) => {
	const n = document.createElement(e);
	return n.append(...(await a)), Object.assign(n, t);
};
```

This is enabled by default - all you have to do is add the field to your `package.json`. You might choose to ship modern JS using the "module" field:

```js
{
  "main": "dist/foo.umd.js",        // legacy UMD bundle (for Node & CDN's)
  "module": "dist/foo.modern.mjs",  // modern ES2017 bundle
  "scripts": {
    "build": "microbundle src/foo.js -f modern,umd"
  }
}
```

## 📦 Usage

Microbundle includes two commands - `build` (the default) and `watch`. Neither require any options, but you can tailor things to suit your needs a bit if you like.

### `microbundle` / `microbundle build`

Unless overridden via the command line, microbundle uses the `source` property in your `package.json` to locate the input file, and the `main` property for the output.

For UMD builds, microbundle will use a snake case version of the `name` field in your `package.json` as export name. This can be overridden either by providing an `amdName` key in your `package.json` or via the `--name` flag in the cli.

### `microbundle watch`

Acts just like `microbundle build`, but watches your source files and rebuilds on any change.

### Using with TypeScript

Just point the input to a `.ts` file through either the cli or the `source` key in your `package.json` and you’re done.

### Specifying builds in `package.json`

You can specify output builds in a `package.json` as follows:

```
"main": "dist/foo.js",          // CJS bundle
"umd:main": "dist/foo.umd.js",  // UMD bundle
"module": "dist/foo.m.js",       // ES Modules bundle
"source": "src/foo.js",         // custom entry module (same as 1st arg to microbundle)
"types": "dist/foo.d.ts",       // TypeScript typings
```

### Mangling Properties

Libraries often wish to rename internal object properties or class members to smaller names - transforming `this._internalIdValue` to `this._i`. Microbundle doesn't currently do this by default, but it can be enabled by adding a "mangle" property to your package.json, with a pattern to control when properties should be mangled. To mangle all property names beginning an underscore, add the following:

```json
{
	"mangle": {
		"regex": "^_"
	}
}
```

### All CLI Options

```
Usage
	$ microbundle <command> [options]

Available Commands
	build    Build once and exit
	watch    Rebuilds on any change

For more info, run any command with the `--help` flag
	$ microbundle build --help
	$ microbundle watch --help

Options
	-v, --version    Displays current version
	-i, --entry      Entry module(s)
	-o, --output     Directory to place build files into
	-f, --format     Only build specified formats  (default modern,es,cjs,umd)
	-w, --watch      Rebuilds on any change  (default false)
	--target         Specify your target environment (node or web)  (default web)
	--external       Specify external dependencies, or 'none'
	--globals        Specify globals dependencies, or 'none'
	--define         Replace constants with hard-coded values
	--alias          Map imports to different modules
	--compress       Compress output using Terser
	--strict         Enforce undefined global context and add "use strict"
	--name           Specify name exposed in UMD builds
	--cwd            Use an alternative working directory  (default .)
	--sourcemap      Generate source map  (default true)
	--raw            Show raw byte size  (default false)
	--jsx            A custom JSX pragma like React.createElement (default: h)
	--tsconfig       Specify the path to a custom tsconfig.json
	-h, --help       Displays this message

Examples
	$ microbundle build --globals react=React,jquery=$
	$ microbundle build --define API_KEY=1234
	$ microbundle build --alias react=preact
	$ microbundle watch --no-sourcemap # don't generate sourcemaps
	$ microbundle build --tsconfig tsconfig.build.json
```

## 🛣 Roadmap

Here's what's coming up for Microbundle:

- [ ] [Multiple separate inputs->outputs](https://github.com/developit/microbundle/issues/50)
- [x] [TypeScript support](https://github.com/developit/microbundle/issues/5)
- [x] [Flowtype support](https://github.com/developit/microbundle/issues/5#issuecomment-351075881)

## 🔨 Built with Microbundle

- [Preact](https://github.com/preactjs/preact) Fast 3kB React alternative with the same modern API. Components & Virtual DOM.
- [Stockroom](https://github.com/developit/stockroom) Offload your store management to a worker easily.
- [Microenvi](https://github.com/fwilkerson/microenvi) Bundle, serve, and hot reload with one command.
- [react-recomponent](https://github.com/philipp-spiess/react-recomponent) Reason-style reducer components for React using ES6 classes.
- [brazilian-utils](https://github.com/brazilian-utils/brazilian-utils) Utils library for specific Brazilian businesses.
- [react-hooks-lib](https://github.com/beizhedenglong/react-hooks-lib) A set of reusable react hooks.
- [mdx-deck-live-code](https://github.com/JReinhold/mdx-deck-live-code) A library for [mdx-deck](https://github.com/jxnblk/mdx-deck) to do live React and JS coding directly in slides.
- [react-router-ext](https://github.com/ri7nz/react-router-ext) An Extended [react-router-dom](https://github.com/ReactTraining/react-router/tree/master/packages/react-router-dom) with simple usage.
- [routex.js](https://github.com/alexhoma/routex.js) A dynamic routing library for Next.js.

## 🥂 License

[MIT](https://oss.ninja/mit/developit/)

[rollup]: https://github.com/rollup/rollup
[bublé]: https://github.com/Rich-Harris/buble
[async-to-promises]: https://github.com/rpetrich/babel-plugin-transform-async-to-promises
