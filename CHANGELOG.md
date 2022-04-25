# microbundle

## 0.15.0

### Minor Changes

- [`6f6e080`](https://github.com/developit/microbundle/commit/6f6e080f3b9ec9a223d79d24eb6e6c8dd5d72cf7) [#950](https://github.com/developit/microbundle/pull/950) Thanks [@rschristian](https://github.com/rschristian)! - Microbundle will now output ESM using `.mjs` as the file extension when the package type is CJS

* [`242754f`](https://github.com/developit/microbundle/commit/242754f43cce1c25a6c475be64bbd2a525eb7cf0) [#949](https://github.com/developit/microbundle/pull/949) Thanks [@rschristian](https://github.com/rschristian)! - Add --visualize flag to generate build output stats

### Patch Changes

- [`c4532cc`](https://github.com/developit/microbundle/commit/c4532cc9ccd846e6bc8176414ddf2c0fc22af1f1) [#940](https://github.com/developit/microbundle/pull/940) Thanks [@rschristian](https://github.com/rschristian)! - Adds information about `--compress` flag's default value w/ different targets

* [`b51b855`](https://github.com/developit/microbundle/commit/b51b855794866f3e6a0ef7dfc5672d5c1c717831) [#935](https://github.com/developit/microbundle/pull/935) Thanks [@mycoin](https://github.com/mycoin)! - Don't attempt to write build stats in watch mode when there has been a build error/sizeInfo is `undefined`

- [`1d0e305`](https://github.com/developit/microbundle/commit/1d0e305d89ad010793c57fc451991a79907e1f3f) [#941](https://github.com/developit/microbundle/pull/941) Thanks [@rschristian](https://github.com/rschristian)! - Ensures TS plugin will begin its search for a 'tsconfig.json' in the set cwd

* [`f04c85a`](https://github.com/developit/microbundle/commit/f04c85a1885a28a16c767665a1d5f17b13834406) [#926](https://github.com/developit/microbundle/pull/926) Thanks [@developit](https://github.com/developit)! - Fix mangle.json being overwritten with `[object Object]`

- [`ecb0b02`](https://github.com/developit/microbundle/commit/ecb0b022912397bcf98550c1a783e9e0534f33e5) [#947](https://github.com/developit/microbundle/pull/947) Thanks [@rschristian](https://github.com/rschristian)! - Ensures hoisted node_modules are excluded from babel

* [`392d63e`](https://github.com/developit/microbundle/commit/392d63ef437f25403c03826f77790722d0234b58) [#919](https://github.com/developit/microbundle/pull/919) Thanks [@rschristian](https://github.com/rschristian)! - Fixes CSS output from being overwritten when also generating .cjs

- [`fb0a437`](https://github.com/developit/microbundle/commit/fb0a43780a7462f4876955c3412638e51a7adb97) [#930](https://github.com/developit/microbundle/pull/930) Thanks [@rschristian](https://github.com/rschristian)! - Documenting --jsxFragment flag

* [`8223eba`](https://github.com/developit/microbundle/commit/8223ebaee8d750e9757b9ddbfef6384fa00f22ac) [#948](https://github.com/developit/microbundle/pull/948) Thanks [@rschristian](https://github.com/rschristian)! - Corrects formatting in build completion message w/ dynamic import is used

## 0.14.2

### Patch Changes

- [`dd0bdde`](https://github.com/developit/microbundle/commit/dd0bdde9c6ae7d0690fa73aead1c1744ae3b086a) [#904](https://github.com/developit/microbundle/pull/904) Thanks [@rschristian](https://github.com/rschristian)! - Added missing CLI doc for 'jsxImportSource' and correcting the Examples section of the '--help' output

## 0.14.1

### Patch Changes

- [`2a0ca88`](https://github.com/developit/microbundle/commit/2a0ca8843f34c3773bb41eb3f8f571fb6b2b2d52) [#882](https://github.com/developit/microbundle/pull/882) Thanks [@MiKr13](https://github.com/MiKr13)! - feat: :sparkles: Closes #497: preserve trailing newline in mangle.json

* [`26f382a`](https://github.com/developit/microbundle/commit/26f382a989e86fdcc5149f73f7b6c9d314a4bf37) [#895](https://github.com/developit/microbundle/pull/895) Thanks [@rschristian](https://github.com/rschristian)! - Completion message shows pkg's actual name, rather than safe name

## 0.14.0

### Minor Changes

- [`1b61029`](https://github.com/developit/microbundle/commit/1b6102966440bd7000e0e457f8c0b7eeb7e05593) [#867](https://github.com/developit/microbundle/pull/867) Thanks [@bouchenoiremarc](https://github.com/bouchenoiremarc)! - - Add support for Module Workers with a new `--workers` flag

### Patch Changes

- [`5e93a0e`](https://github.com/developit/microbundle/commit/5e93a0e4cc28ea8f080a08e3a8530b6bfdf25f42) [#853](https://github.com/developit/microbundle/pull/853) Thanks [@developit](https://github.com/developit)! - Fix crash when traversing `"exports"` objects (#852)

* [`96b85da`](https://github.com/developit/microbundle/commit/96b85da1e32b4ffbef9d83387ff399d8b3ee3852) [#887](https://github.com/developit/microbundle/pull/887) Thanks [@developit](https://github.com/developit)! - When using `--target node`, resolve "node" conditional Package Export keys, otherwise resolve "browser" keys.

- [`5d0465b`](https://github.com/developit/microbundle/commit/5d0465b39bccff31673d351fc9d29cb4c470407d) [#875](https://github.com/developit/microbundle/pull/875) Thanks [@dwightjack](https://github.com/dwightjack)! - Preserve terser annotations in compressed bundle

* [`b1a6374`](https://github.com/developit/microbundle/commit/b1a637486234a2ae784ccf0c512321e2d3efef7c) [#858](https://github.com/developit/microbundle/pull/858) Thanks [@bouchenoiremarc](https://github.com/bouchenoiremarc)! - - Allow the minify options `compress` and `mangle` to be set as booleans

- [`2980336`](https://github.com/developit/microbundle/commit/29803364fe54cc1a7a8543d61e694c90b4cdce6a) [#865](https://github.com/developit/microbundle/pull/865) Thanks [@rschristian](https://github.com/rschristian)! - Expands generateTypes flag to support libs with TS entrypoints

## 0.13.3

### Patch Changes

- [`3534815`](https://github.com/developit/microbundle/commit/3534815ddabecc080cdec42cd1f6009a81a48ec9) [#848](https://github.com/developit/microbundle/pull/848) Thanks [@developit](https://github.com/developit)! - Bugfix: preserve Terser annotations like `/*@__NOINLINE__*/` during Babel pass

## 0.13.2

### Patch Changes

- [`e3f1933`](https://github.com/developit/microbundle/commit/e3f1933773fd17bb1d97de0dad94d899acee7598) [#847](https://github.com/developit/microbundle/pull/847) Thanks [@developit](https://github.com/developit)! - - Upgrade to Terser [5.7](https://github.com/terser/terser/blob/master/CHANGELOG.md#v570) to re-enable support for `reduce_funcs:false` in `mangle.json` configuration.

* [`86371f0`](https://github.com/developit/microbundle/commit/86371f0db6386089c66cd474a7121d9dbee4c0cf) [#784](https://github.com/developit/microbundle/pull/784) Thanks [@rschristian](https://github.com/rschristian)! - Allows users to customize the modern output's filename using "exports" like they can with "esmodules"

## 0.13.1

### Patch Changes

- [`54402ac`](https://github.com/developit/microbundle/commit/54402ac43cc2f7ccb85fe5df2e9828c7f24091a0) [#830](https://github.com/developit/microbundle/pull/830) Thanks [@JounQin](https://github.com/JounQin)! - fix: add generateTypes cli option, check false value correctly

* [`edcd777`](https://github.com/developit/microbundle/commit/edcd777cfaedfdb436c62b5dcb3cff6291268e4c) [#823](https://github.com/developit/microbundle/pull/823) Thanks [@rschristian](https://github.com/rschristian)! - Ensures ambient type declaration for CSS Modules is included in the published bundle

- [`d87a5dc`](https://github.com/developit/microbundle/commit/d87a5dc286a1edba92ca3ec5b534807688c90854) Thanks [@developit](https://github.com/developit)! - - Fix `--sourcemap=false` to match `--no-sourcemap` and actually turn sourcemaps off.

* [`6f1a20f`](https://github.com/developit/microbundle/commit/6f1a20fa17467176f9bc1acc2b0f78784d28d110) [#777](https://github.com/developit/microbundle/pull/777) Thanks [@rschristian](https://github.com/rschristian)! - Fixing a bug that would cause a CSS file to be generated to match each JS build output

- [`25b73d2`](https://github.com/developit/microbundle/commit/25b73d22caeac7cf74b0533401318a5becc29c11) [#834](https://github.com/developit/microbundle/pull/834) Thanks [@cometkim](https://github.com/cometkim)! - Add support for configuration overrides using the `publishConfig` package.json field.

* [`0a4cddf`](https://github.com/developit/microbundle/commit/0a4cddf98ab54c41f0b2ece1d626e459f73c9997) [#842](https://github.com/developit/microbundle/pull/842) Thanks [@ForsakenHarmony](https://github.com/ForsakenHarmony)! - fix default extension to cjs for package.json "type":"module"

- [`4f7fbc4`](https://github.com/developit/microbundle/commit/4f7fbc4a0b9e03b9c33d10b21c66b8ddef7524a7) Thanks [@developit](https://github.com/developit)! - Fix `transform-fast-rest` to support referencing `...rest` params from within closures.

* [`0c91795`](https://github.com/developit/microbundle/commit/0c917959570c788929766c6f4cd55f3b49433920) [#841](https://github.com/developit/microbundle/pull/841) Thanks [@rschristian](https://github.com/rschristian)! - Ensures JS format is not included in CSS filename output

## 0.13.0

### Minor Changes

- [`bd5d15e`](https://github.com/developit/microbundle/commit/bd5d15e17c882f2090f519d342dd89e694456ab8) [#738](https://github.com/developit/microbundle/pull/738) Thanks [@wardpeet](https://github.com/wardpeet)! - Upgrade rollup to version latest and upgrade all its dependencies

* [`967f8d5`](https://github.com/developit/microbundle/commit/967f8d532785aa7bf8636c5a759759a3e72dcf56) [#769](https://github.com/developit/microbundle/pull/769) Thanks [@developit](https://github.com/developit)! - Add `--css inline` option. The default CSS output for all formats is now external files (as it was supposed to be).

- [`8142704`](https://github.com/developit/microbundle/commit/8142704399efe6b4f34219c711a3932431781b36) [#741](https://github.com/developit/microbundle/pull/741) Thanks [@whitetrefoil](https://github.com/whitetrefoil)! - Use user's typescript first, fallback to bundled

### Patch Changes

- [`12668b9`](https://github.com/developit/microbundle/commit/12668b993906a0267c53c3601ce89d1c0ddfbc27) [#687](https://github.com/developit/microbundle/pull/687) Thanks [@developit](https://github.com/developit)! - Add friendly microbundle-specific errors when modules can't be resolved.

* [`8b60fc8`](https://github.com/developit/microbundle/commit/8b60fc86cbc493e23230a58cd0c99e2e0c675974) [#754](https://github.com/developit/microbundle/pull/754) Thanks [@stipsan](https://github.com/stipsan)! - Enable sourcemaps for CSS

- [`fdafaf7`](https://github.com/developit/microbundle/commit/fdafaf7a4ad76b1757e2c0ff39050f8e11e2f1d5) [#764](https://github.com/developit/microbundle/pull/764) Thanks [@bakerkretzmar](https://github.com/bakerkretzmar)! - Add support for generating inline sourcemaps

* [`52a1771`](https://github.com/developit/microbundle/commit/52a177190eb45791cb4b44d4bf04732b8b98d9c3) [#768](https://github.com/developit/microbundle/pull/768) Thanks [@developit](https://github.com/developit)! - Add ambient typescript declaration for CSS Modules

## 0.12.4

### Patch Changes

- [`ffcc9d9`](https://github.com/developit/microbundle/commit/ffcc9d9b7d9518ae2fa31b2af4d1fd4f98599560) [#713](https://github.com/developit/microbundle/pull/713) Thanks [@developit](https://github.com/developit)! - Support [extending a UMD global](https://rollupjs.org/guide/en/#outputextend) by prefixing the package.json `"amdName"` field (eg: `"global.xyz"`).

* [`0527862`](https://github.com/developit/microbundle/commit/052786223edce8258c73a72a49238e41e5b24850) [#722](https://github.com/developit/microbundle/pull/722) Thanks [@developit](https://github.com/developit)! - Support "esm" (`-f esm`) as an alias of "es" format.

- [`d08f977`](https://github.com/developit/microbundle/commit/d08f977aa6b19b267cf8d12861cc5cc34380d025) [#702](https://github.com/developit/microbundle/pull/702) Thanks [@wardpeet](https://github.com/wardpeet)! - Use @babel/preset-env with bugfixes instead of preset-modules to enable "Optional chaining" & "nullish coalescing" by default.

* [`d33a7ba`](https://github.com/developit/microbundle/commit/d33a7ba2f5475e870d1a0f659b0c3ec0c459a850) [#731](https://github.com/developit/microbundle/pull/731) Thanks [@vaneenige](https://github.com/vaneenige)! - Add jsxImportSource flag for new JSX runtime

- [`0fec414`](https://github.com/developit/microbundle/commit/0fec41493c39669270ba2b58401dc591e551d96d) [#716](https://github.com/developit/microbundle/pull/716) Thanks [@wardpeet](https://github.com/wardpeet)! - Don't transpile generators and async for Node

* [`ba1c047`](https://github.com/developit/microbundle/commit/ba1c047512356e0e48911f5f037be798c5c2b9eb) [#701](https://github.com/developit/microbundle/pull/701) Thanks [@wardpeet](https://github.com/wardpeet)! - re-enable unpkg alias for umd bundles as described in the readme

- [`3488411`](https://github.com/developit/microbundle/commit/34884116e21408305b337a9f6267f6c2ddc9e72d) [#700](https://github.com/developit/microbundle/pull/700) Thanks [@wardpeet](https://github.com/wardpeet)! - Disable warnings for node's builtin-modules when using node as a target environment.
