import { computeEntries } from '../src/lib/compute-entries';

function mk(pkg, entries) {
	entries = entries || pkg.source;
	if (!Array.isArray(entries)) entries = [entries];
	return {
		pkg: {
			name: 'my-mod',
			...pkg,
		},
		cwd: '/example/repo',
		entry: entries[0],
		entries,
		multipleEntries: entries.length > 1,
	};
}

describe('computeEntries()', () => {
	describe('single entry', () => {
		describe('only legacy entries', () => {
			it('"main"', () => {
				const entries = computeEntries(
					mk({
						main: './dist/mod.js',
						source: ['src/a.js'],
					}),
				);

				expect(entries).toMatchInlineSnapshot(`
					Object {
					  "cjs": "./dist/mod.js",
					  "es": "./dist/mod.esm.js",
					  "modern": "./dist/mod.modern.js",
					  "umd": "./dist/mod.umd.js",
					}
				`);
			});

			it('"main" and "module"', () => {
				const entries = computeEntries(
					mk({
						main: './dist/mod.js',
						module: './dist/mod.mjs',
						source: ['src/a.js'],
					}),
				);

				expect(entries).toMatchInlineSnapshot(`
					Object {
					  "cjs": "./dist/mod.js",
					  "es": "./dist/mod.mjs",
					  "modern": "./dist/mod.modern.js",
					  "umd": "./dist/mod.umd.js",
					}
				`);
			});

			it('"main", "module", "unpkg"', () => {
				const entries = computeEntries(
					mk({
						main: './dist/mod.js',
						module: './dist/mod.mjs',
						unpkg: './dist/mod-umd.js',
						source: ['src/a.js'],
					}),
				);

				expect(entries).toMatchInlineSnapshot(`
						Object {
						  "cjs": "./dist/mod.js",
						  "es": "./dist/mod.mjs",
						  "modern": "./dist/mod.modern.js",
						  "umd": "./dist/mod-umd.js",
						}
				`);
			});

			it('"main", "module", "esmodule"', () => {
				const entries = computeEntries(
					mk({
						main: './dist/mod.js',
						module: './dist/mod.mjs',
						esmodule: './dist/mod.modern.mjs',
						source: ['src/a.js'],
					}),
				);

				expect(entries).toMatchInlineSnapshot(`
						Object {
						  "cjs": "./dist/mod.js",
						  "es": "./dist/mod.mjs",
						  "modern": "./dist/mod.modern.mjs",
						  "umd": "./dist/mod.umd.js",
						}
				`);
			});

			it('"esmodule"', () => {
				const entries = computeEntries(
					mk({
						esmodule: './dist/mod.modern.mjs',
						source: ['src/a.js'],
					}),
				);

				expect(entries).toMatchInlineSnapshot(`
						Object {
						  "cjs": "./dist/index.js",
						  "es": "./dist/index.esm.mjs",
						  "modern": "./dist/mod.modern.mjs",
						  "umd": "./dist/index.umd.js",
						}
				`);
			});
		});

		describe('Package Exports', () => {
			it('should generate entries using only an export map', () => {
				const entries = computeEntries(
					mk({
						exports: './dist/mod.mjs',
						source: ['src/a.js'],
					}),
				);

				expect(entries).toMatchInlineSnapshot(`
						Object {
						  "cjs": "./dist/mod.js",
						  "es": "./dist/mod.esm.mjs",
						  "modern": "./dist/mod.mjs",
						  "umd": "./dist/mod.umd.js",
						}
				`);
			});

			it('should support array fallbacks for default exports (mjs first)', () => {
				const entries = computeEntries(
					mk({
						exports: ['./dist/mod.mjs', './dist/mod-cjs.js'],
						source: ['src/a.js'],
					}),
				);

				expect(entries).toMatchInlineSnapshot(`
						Object {
						  "cjs": "./dist/mod-cjs.js",
						  "es": "./dist/mod.esm.mjs",
						  "modern": "./dist/mod.mjs",
						  "umd": "./dist/mod.umd.js",
						}
				`);
			});

			it('should support array fallbacks for default exports (cjs first)', () => {
				const entries = computeEntries(
					mk({
						type: 'module',
						exports: ['./dist/mod.cjs', './dist/mod.js'],
						source: ['src/a.js'],
					}),
				);

				expect(entries).toMatchInlineSnapshot(`
						Object {
						  "cjs": "./dist/mod.cjs",
						  "es": "./dist/mod.esm.js",
						  "modern": "./dist/mod.js",
						  "umd": "./dist/mod.umd.cjs",
						}
				`);
			});

			it('should default to generating modern output for "import"', () => {
				const entries = computeEntries(
					mk({
						exports: {
							import: './dist/mod.modern.mjs',
							require: './dist/mod.js',
							default: './dist/mod.umd.js',
						},
						source: ['src/a.js'],
					}),
				);

				expect(entries).toMatchInlineSnapshot(`
						Object {
						  "cjs": "./dist/mod.js",
						  "es": "./dist/mod.esm.mjs",
						  "modern": "./dist/mod.modern.mjs",
						  "umd": "./dist/mod.umd.js",
						}
				`);
			});

			it('should generate entries when all exports are explicitly defined', () => {
				const entries = computeEntries(
					mk({
						exports: {
							modern: './dist/mod.modern.mjs',
							import: './dist/mod.mjs',
							require: './dist/mod.js',
							default: './dist/mod.umd.js',
						},
						source: ['src/a.js'],
					}),
				);

				expect(entries).toMatchInlineSnapshot(`
						Object {
						  "cjs": "./dist/mod.js",
						  "es": "./dist/mod.mjs",
						  "modern": "./dist/mod.modern.mjs",
						  "umd": "./dist/mod.umd.js",
						}
				`);
			});
		});

		describe('both legacy and package exports', () => {
			it('should use exports as modern', () => {
				const entries = computeEntries(
					mk({
						main: './dist/mod.js',
						module: './dist/mod.mjs',
						exports: './dist/mod.modern.mjs',
						unpkg: './dist/mod-umd.js',
						source: ['src/a.js'],
					}),
				);

				expect(entries).toMatchInlineSnapshot(`
						Object {
						  "cjs": "./dist/mod.js",
						  "es": "./dist/mod.mjs",
						  "modern": "./dist/mod.modern.mjs",
						  "umd": "./dist/mod-umd.js",
						}
				`);
			});

			it('should generate entries when defined in both maps', () => {
				const entries = computeEntries(
					mk({
						main: './dist/mod.js',
						module: './dist/mod.mjs',
						unpkg: './dist/mod-umd.js',
						exports: {
							import: './dist/mod.modern.mjs',
							default: './dist/mod.js',
						},
						source: ['src/a.js'],
					}),
				);

				expect(entries).toMatchInlineSnapshot(`
						Object {
						  "cjs": "./dist/mod.js",
						  "es": "./dist/mod.mjs",
						  "modern": "./dist/mod.modern.mjs",
						  "umd": "./dist/mod-umd.js",
						}
				`);
			});
		});
	});

	describe('multi entry', () => {
		function ensureEntriesHaveFilename(entries, name) {
			const reg = new RegExp(`\\/${name}(\\.\\w+)*\\.[mc]?js$`);
			expect(entries).toEqual({
				cjs: expect.stringMatching(reg),
				es: expect.stringMatching(reg),
				modern: expect.stringMatching(reg),
				umd: expect.stringMatching(reg),
			});
		}

		describe('only legacy entries', () => {
			it('"main"', () => {
				const opts = mk({
					main: './dist/mod.js',
					source: ['src/a.js', 'src/b.js'],
				});
				const entries = {
					'./a': computeEntries({ ...opts, entry: 'src/a.js' }),
					'./b': computeEntries({ ...opts, entry: 'src/b.js' }),
				};

				// default entry gets its name from `main`:
				ensureEntriesHaveFilename(entries['./a'], 'mod');
				// all additional entries compute their own names:
				ensureEntriesHaveFilename(entries['./b'], 'b');

				expect(entries).toMatchInlineSnapshot(`
					Object {
					  "./a": Object {
					    "cjs": "./dist/mod.js",
					    "es": "./dist/mod.esm.js",
					    "modern": "./dist/mod.modern.js",
					    "umd": "./dist/mod.umd.js",
					  },
					  "./b": Object {
					    "cjs": "./dist/b.js",
					    "es": "./dist/b.esm.js",
					    "modern": "./dist/b.modern.js",
					    "umd": "./dist/b.umd.js",
					  },
					}
				`);
			});

			it('"module", "main"', () => {
				const opts = mk({
					module: './dist/mod.esm.js',
					main: './dist/mod.js',
					source: ['src/a.js', 'src/b.js'],
				});
				const entries = {
					'./a': computeEntries({ ...opts, entry: 'src/a.js' }),
					'./b': computeEntries({ ...opts, entry: 'src/b.js' }),
				};

				// default entry gets its name from `main`:
				ensureEntriesHaveFilename(entries['./a'], 'mod');
				// all additional entries compute their own names:
				ensureEntriesHaveFilename(entries['./b'], 'b');

				expect(entries).toMatchInlineSnapshot(`
					Object {
					  "./a": Object {
					    "cjs": "./dist/mod.js",
					    "es": "./dist/mod.esm.js",
					    "modern": "./dist/mod.modern.js",
					    "umd": "./dist/mod.umd.js",
					  },
					  "./b": Object {
					    "cjs": "./dist/b.js",
					    "es": "./dist/b.esm.js",
					    "modern": "./dist/b.modern.js",
					    "umd": "./dist/b.umd.js",
					  },
					}
				`);
			});
		});

		describe('only package exports', () => {
			it('should generate multiple entries when all exports are defined, in a CJS/legacy package', () => {
				const opts = mk({
					exports: {
						'.': {
							modern: './dist/main.modern.mjs',
							import: './dist/main.mjs',
							require: './dist/main.js',
							default: './dist/main.umd.js',
						},
						'./b': {
							modern: './dist/b.modern.mjs',
							import: './dist/b.mjs',
							require: './dist/b.js',
							default: './dist/b.umd.js',
						},
					},
					source: ['src/a.js', 'src/b.js'],
				});
				const entries = {
					'./a': computeEntries({ ...opts, entry: 'src/a.js' }),
					'./b': computeEntries({ ...opts, entry: 'src/b.js' }),
				};

				// default entry gets its name from `main`:
				ensureEntriesHaveFilename(entries['./a'], 'main');
				// all additional entries compute their own names:
				ensureEntriesHaveFilename(entries['./b'], 'b');

				expect(entries).toMatchInlineSnapshot(`
					Object {
					  "./a": Object {
					    "cjs": "./dist/main.js",
					    "es": "./dist/main.mjs",
					    "modern": "./dist/main.modern.mjs",
					    "umd": "./dist/main.umd.js",
					  },
					  "./b": Object {
					    "cjs": "./dist/b.js",
					    "es": "./dist/b.mjs",
					    "modern": "./dist/b.modern.mjs",
					    "umd": "./dist/b.umd.js",
					  },
					}
				`);
			});

			it('should generate multiple entries when all exports are defined, in a {type:module} package', () => {
				const opts = mk({
					type: 'module',
					exports: {
						'.': {
							modern: './dist/main.modern.js',
							import: './dist/main.js',
							require: './dist/main.cjs',
							default: './dist/main.umd.cjs',
						},
						'./b': {
							modern: './dist/b.modern.js',
							import: './dist/b.js',
							require: './dist/b.cjs',
							default: './dist/b.umd.cjs',
						},
					},
					source: ['src/a.js', 'src/b.js'],
				});
				const entries = {
					'./a': computeEntries({ ...opts, entry: 'src/a.js' }),
					'./b': computeEntries({ ...opts, entry: 'src/b.js' }),
				};

				// default entry gets its name from `main`:
				ensureEntriesHaveFilename(entries['./a'], 'main');
				// all additional entries compute their own names:
				ensureEntriesHaveFilename(entries['./b'], 'b');

				expect(entries).toMatchInlineSnapshot(`
					Object {
					  "./a": Object {
					    "cjs": "./dist/main.cjs",
					    "es": "./dist/main.js",
					    "modern": "./dist/main.modern.js",
					    "umd": "./dist/main.umd.cjs",
					  },
					  "./b": Object {
					    "cjs": "./dist/b.cjs",
					    "es": "./dist/b.js",
					    "modern": "./dist/b.modern.js",
					    "umd": "./dist/b.umd.cjs",
					  },
					}
				`);
			});
		});
	});
});
