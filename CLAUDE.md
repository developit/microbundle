# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Microbundle is a zero-configuration bundler for tiny JavaScript libraries, powered by Rollup. It takes source code and produces multiple output formats (modern ES modules, CommonJS, UMD) with minimal setup.

## Development Commands

### Building

- `npm run build` - Full build: first builds with Babel, then self-builds
- `npm run build:babel` - Build using Babel only
- `npm run build:self` - Self-build using microbundle's own dist output
- `npm run prepare` - Runs full build (called before npm publish)

### Testing

- `npm test` - Run linter, build, and Jest tests
- `npm run jest` - Run Jest tests only (without lint/build)
- Test timeout is set to 11 seconds for fixture tests

### Linting and Formatting

- `npm run lint` - Run ESLint on src directory
- `npm run format` - Format all JS and CSS files with Prettier

### Running Tests

Individual tests can be run with Jest's standard CLI options:

```bash
npm run jest -- --testNamePattern="build shebang"
npm run jest -- test/index.test.js
```

## Architecture

### Entry Points

- **src/cli.js** - CLI entry point (shebang script), parses arguments and invokes main function
- **src/index.js** - Main bundling logic, exports the `microbundle()` function
- **src/prog.js** - CLI command definitions using `sade` library

### Core Build Flow

1. **Input Resolution** (`getInput()` in src/index.js:205)

   - Resolves entry files from CLI args, `source` field in package.json, or defaults (src/index.js, index.js)
   - Supports glob patterns for multiple entries
   - Handles TypeScript (.ts/.tsx) and JavaScript files

2. **Output Resolution** (`getOutput()` in src/index.js:227)

   - Determines output location from CLI args or package.json `main` field
   - Defaults to dist/ directory

3. **Format Generation** (`getMain()` in src/index.js:278)

   - Maps each format (modern, es, cjs, umd) to appropriate output filenames
   - Reads from package.json fields: `module`, `main`, `exports`, `unpkg`, etc.
   - Respects `{"type":"module"}` for ES Module packages

4. **Configuration Creation** (`createConfig()` in src/index.js:327)

   - Creates Rollup configuration for each entry/format combination
   - Configures plugins: Babel, TypeScript, PostCSS, Terser, etc.
   - Handles externals (dependencies vs devDependencies)
   - Manages source maps, compression, and name caching

5. **Build Execution**
   - Sequential builds with caching (cjs format builds first)
   - Watch mode available via Rollup's watch API

### Format Types

- **modern** - ES2017+ with modern syntax (async/await, arrow functions) for `<script type="module">`
- **es** (esm) - Transpiled ES modules for older bundlers
- **cjs** - CommonJS for Node.js
- **umd** - Universal Module Definition for CDNs and older environments
- **iife** - Immediately Invoked Function Expression

### Key Subdirectories

**src/lib/** - Utility modules:

- **babel-custom.js** - Custom Babel plugin configuration
- **package-info.js** - Reads and normalizes package.json config
- **terser.js** - Minification options normalization
- **css-modules.js** - CSS Modules configuration logic
- **compressed-size.js** - Calculates gzipped/brotli bundle sizes
- **option-normalization.js** - Parses CLI arguments (--alias, --define, etc.)

**test/fixtures/** - Integration test fixtures (each subdirectory is a test case with package.json and source)

### External Dependencies Handling

- **Externals** (src/index.js:331-357): By default, `dependencies` and `peerDependencies` are external (not bundled)
- **Bundled**: `devDependencies` are bundled into the output
- Override with `--external` flag or `--external none` to bundle everything

### Special Features

**TypeScript Support** (src/index.js:533-564):

- Automatically detected by .ts/.tsx file extension
- Uses rollup-plugin-typescript2
- Generates declaration files when `types` or `typings` is set in package.json
- Respects tsconfig.json with overrides for `module: "ESNext"` and `target: "esnext"`

**CSS Handling** (src/index.js:490-502):

- PostCSS with autoprefixer
- CSS Modules support (files ending in .module.css or via --css-modules flag)
- Output modes: external (default) or inline

**Property Mangling** (src/index.js:385-433):

- Reads from `mangle.json` or package.json `mangle`/`minify` field
- Name cache persisted across builds for consistent output

**Worker Support** (src/index.js:648):

- Bundles Web Workers via @surma/rollup-plugin-off-main-thread
- Only works with es/modern formats
- Enable with --workers flag

### Testing Structure

- **test/index.test.js** - Main test suite
- **test/fixtures/** - Each subdirectory contains a mini-project to build
- Tests snapshot the build output and directory structure
- Uses Jest with a custom build harness

## Common Development Patterns

### Adding New CLI Options

1. Add option definition in src/prog.js
2. Access via `options.<name>` in src/index.js
3. Pass to relevant plugin configuration in `createConfig()`

### Adding Rollup Plugins

Add to the plugins array in src/index.js:488-701, typically with conditional logic and `.filter(Boolean)` to remove falsy entries

### Debugging Builds

- Use `--no-compress` to disable minification
- Check rollup warnings in `onwarn` handler (src/index.js:469-482)
- Modern format disables Rollup cache (src/index.js:437) to prevent legacy transpilation leaking

## Important Notes

- The build is "self-hosted": microbundle builds itself (see build:self script)
- CJS format always builds first to populate cache for other formats (src/index.js:109)
- Modern format uses Babel's bugfixes mode to target browsers with `<script type="module">` support
- Shebang lines are extracted and re-added to preserve them (src/index.js:524-531, 712-713)
