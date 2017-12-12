<p align="center">
  <img src="https://cdn.rawgit.com/developit/de05e4e17963ce2a714c61ccc4fd3d97/raw/7e5e606ee3a781ef393bf4e070a57547c2ccb3f6/microbundle.svg" width="300" height="300" alt="microbundle">
  <br>
  <a href="https://www.npmjs.org/package/microbundle"><img src="https://img.shields.io/npm/v/microbundle.svg?style=flat" alt="npm"></a> <a href="https://travis-ci.org/developit/microbundle"><img src="https://travis-ci.org/developit/microbundle.svg?branch=master" alt="travis"></a>
</p>

# Microbundle

A **zero-configuration** bundler for _tiny modules_, powered by [Rollup].

- Bundles your library using nothing but a `package.json`
- Supports multiple entry modules (`cli.js` + `index.js`, etc)
- Creates multiple output formats for each entry (CommonJS, UMD & ESM)

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


### `microbundle` / `microbundle build`

By default, microbundle will infer the location of your source entry file
(the root module in your program) from the `module` field in your `package.json`. It will infer the output directory and filename(s) from the `main` field.

### `microbundle watch`

Watches source files and rebuilds on any change.


```
microbundle [entries..]

Build once and exit

Commands:
  cli.js build [entries..]  Build once and exit             [default]
  cli.js watch [entries..]  Rebuilds on any change

Options:
  --version        Show version number                      [boolean]
  --entry, -i      Entry module(s)
                                 [string] [default: <package.module>]
  --output, -o     Directory to place build files into
                  [string] [default: <dirname(package.main), build/>]
  --cwd            Use an alternative working directory
                                                [string] [default: .]
  --format         Only build specified formats
                                       [string] [default: es,cjs,umd]
  --compress       Compress output using UglifyJS
                                            [boolean] [default: true]
  --strict         Enforce undefined global context and add "use
                   strict"                           [default: false]
```

## License

MIT


[Rollup]: https://github.com/rollup/rollup
