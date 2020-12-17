# microbundle

## 0.12.4
### Patch Changes



- [`ffcc9d9`](https://github.com/developit/microbundle/commit/ffcc9d9b7d9518ae2fa31b2af4d1fd4f98599560) [#713](https://github.com/developit/microbundle/pull/713) Thanks [@developit](https://github.com/developit)! - Support [extending a UMD global](https://rollupjs.org/guide/en/#outputextend) by prefixing the package.json `"amdName"` field (eg: `"global.xyz"`).



- [`0527862`](https://github.com/developit/microbundle/commit/052786223edce8258c73a72a49238e41e5b24850) [#722](https://github.com/developit/microbundle/pull/722) Thanks [@developit](https://github.com/developit)! - Support "esm" (`-f esm`) as an alias of "es" format.



- [`d08f977`](https://github.com/developit/microbundle/commit/d08f977aa6b19b267cf8d12861cc5cc34380d025) [#702](https://github.com/developit/microbundle/pull/702) Thanks [@wardpeet](https://github.com/wardpeet)! - Use @babel/preset-env with bugfixes instead of preset-modules to enable "Optional chaining" & "nullish coalescing" by default.



- [`d33a7ba`](https://github.com/developit/microbundle/commit/d33a7ba2f5475e870d1a0f659b0c3ec0c459a850) [#731](https://github.com/developit/microbundle/pull/731) Thanks [@vaneenige](https://github.com/vaneenige)! - Add jsxImportSource flag for new JSX runtime



- [`0fec414`](https://github.com/developit/microbundle/commit/0fec41493c39669270ba2b58401dc591e551d96d) [#716](https://github.com/developit/microbundle/pull/716) Thanks [@wardpeet](https://github.com/wardpeet)! - Don't transpile generators and async for Node



- [`ba1c047`](https://github.com/developit/microbundle/commit/ba1c047512356e0e48911f5f037be798c5c2b9eb) [#701](https://github.com/developit/microbundle/pull/701) Thanks [@wardpeet](https://github.com/wardpeet)! - re-enable unpkg alias for umd bundles as described in the readme



- [`3488411`](https://github.com/developit/microbundle/commit/34884116e21408305b337a9f6267f6c2ddc9e72d) [#700](https://github.com/developit/microbundle/pull/700) Thanks [@wardpeet](https://github.com/wardpeet)! - Disable warnings for node's builtin-modules when using node as a target environment.
