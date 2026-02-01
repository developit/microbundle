# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Microbundle is a zero-configuration bundler for tiny JavaScript libraries, powered by Rollup. It takes source code and produces multiple output formats (modern ES modules, CommonJS, UMD) with minimal setup.

## Quick Reference

```bash
npm run build      # Full build (Babel + self-build)
npm test           # Lint + build + tests
npm run jest       # Tests only
npm run lint       # ESLint
npm run format     # Prettier
npm run changeset  # Create changelog entry
npm run release    # Publish (prepare + test + changeset publish)
```

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

### Changesets and Versioning

This project uses [@changesets/cli](https://github.com/changesets/changesets) for changelog management.

- `npm run changeset` - Create a new changeset (prompts for type: major/minor/patch)
- `npm run release` - Full release: prepare + test + changeset publish
- Base branch: `master`
- Changesets are not auto-committed

### Running Tests

Individual tests can be run with Jest's standard CLI options:

```bash
npm run jest -- --testNamePattern="build shebang"
npm run jest -- test/index.test.js
```

## Code Style

This project uses Prettier with:
- **Tabs** for indentation (not spaces)
- **Single quotes** for strings
- **Trailing commas** in multi-line structures
- **No parens** around single arrow function parameters

ESLint extends `eslint-config-developit` with Prettier integration.

## Architecture

### Entry Points

- **src/cli.js** - CLI entry point (shebang script), parses arguments and invokes main function
- **src/index.js** - Main bundling logic, exports the `microbundle()` function
- **src/prog.js** - CLI command definitions using `sade` library

### Core Build Flow

1. **Input Resolution** (`getInput()` in src/index.js)

   - Resolves entry files from CLI args, `source` field in package.json, or defaults (src/index.js, index.js)
   - Supports glob patterns for multiple entries
   - Handles TypeScript (.ts/.tsx) and JavaScript files

2. **Output Resolution** (`getOutput()` in src/index.js)

   - Determines output location from CLI args or package.json `main` field
   - Defaults to dist/ directory

3. **Format Generation** (`getMain()` in src/index.js)

   - Maps each format (modern, es, cjs, umd) to appropriate output filenames
   - Reads from package.json fields: `module`, `main`, `exports`, `unpkg`, etc.
   - Respects `{"type":"module"}` for ES Module packages

4. **Configuration Creation** (`createConfig()` in src/index.js)

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
- **transform-fast-rest.js** - Babel plugin for optimized rest/spread transforms
- **\_\_entry\_\_.js** - Entry point wrapper for worker builds

**test/fixtures/** - Integration test fixtures (each subdirectory is a test case with package.json and source)

### External Dependencies Handling

- By default, `dependencies` and `peerDependencies` are external (not bundled)
- `devDependencies` are bundled into the output
- Override with `--external` flag or `--external none` to bundle everything

### Special Features

**TypeScript Support:**
- Automatically detected by .ts/.tsx file extension
- Uses rollup-plugin-typescript2
- Generates declaration files when `types` or `typings` is set in package.json
- Respects tsconfig.json with overrides for `module: "ESNext"` and `target: "esnext"`

**CSS Handling:**
- PostCSS with autoprefixer
- CSS Modules support (files ending in .module.css or via --css-modules flag)
- Output modes: external (default) or inline

**Property Mangling:**
- Reads from `mangle.json` or package.json `mangle`/`minify` field
- Name cache persisted across builds for consistent output

**Worker Support:**
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

Add to the plugins array in `createConfig()` in src/index.js, typically with conditional logic and `.filter(Boolean)` to remove falsy entries.

### Debugging Builds

- Use `--no-compress` to disable minification
- Check rollup warnings in `onwarn` handler in src/index.js
- Modern format disables Rollup cache to prevent legacy transpilation leaking

## Important Notes

- The build is "self-hosted": microbundle builds itself (see build:self script)
- CJS format always builds first to populate cache for other formats
- Modern format uses Babel's bugfixes mode to target browsers with `<script type="module">` support
- Shebang lines are extracted and re-added to preserve them in CLI scripts
