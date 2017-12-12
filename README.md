# Microbundle

A zero-configuration bundler for tiny modules, powered by Rollup.

- Reads all the necessary information from your `package.json`
- Supports multiple entry modules (`cli.js` + `index.js`, etc)
- Creates multiple output formats for each entry (CommonJS, UMD & ESM).

## Installation

`npm i -D microbundle`

... then add it as an npm script:

```js
{
	"scripts": {
		"build": "microbundle",
		"dev": "microbundle watch"
	}
}
```

## Usage

```
microbundle [entries..]

Build once and exit

Commands:
  cli.js build [entries..]  Build once and exit                        [default]
  cli.js watch [entries..]  Rebuilds on any change

Options:
  --version                   Show version number                      [boolean]
  --entry, -i                 Entry module(s)
                                            [string] [default: <package.module>]
  --output, -o, -d            Directory to place build files into
                             [string] [default: <dirname(package.main), build/>]
  --cwd                       Use an alternative working directory
                                                           [string] [default: .]
  --format                    Only build specified formats
                                                  [string] [default: es,cjs,umd]
  --compress                  Compress output using UglifyJS
                                                       [boolean] [default: true]
  --strict                    Enforce undefined global context and add "use
                              strict"                           [default: false]
```

## License

MIT
