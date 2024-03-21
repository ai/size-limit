# Change Log
This project adheres to [Semantic Versioning](http://semver.org/).

## 11.1.2
* Fixed CSS support in esbuild plugin (by @just-boris).

## 11.1.1
* Fixed Windows support (by @aryaemami59).

## 11.1.0
* Added TypeScript support for config (by @aryaemami59).
* Fixed `webpack-why` regression (by @hoo00nn).

## 11.0.3
* Fixed `.mjs` config support (by Arya Emami).
* Updated `esbuild`.

## 11.0.2
* Fixed `require is not defined` regression.
* Updated `esbuild-visualizer`.

## 11.0.1
* Updated `estimo`.
* Updated `lilconfig`.

## 11.0
* Moved to Brotli as default compression. Use `gzip: true` for old behavior.

## 10.0.3
* Fixed third-party plugins support (by @JounQin).
* Fixed Windows support (by @JounQin).

## 10.0.2
* Fixed `require is not defined` in `webpack-css` (by Andrey Medvedev).
* Fixed webpack config defined as function support (by @lev875).

## 10.0.1
* Fixed imports and exports between packages.

## 10.0
* Removed `@size-limit/dual-publish` plugin.
* Moved projects to ESM (by @lev875).
  Size Limit still can be used as CLI in CJS projects.
* Updated `globby` dependency.

## 9.0
* Remove Node.js 14 and 16 support.
* Moved to React from CDN for `time` plugin (by Aakansha Doshi).

## 8.2.6
* Fixed npm release process.

## 8.2.5
* Fixed opening report in `@size-limit/esbuild-why` (by Yaroslav Chapelskyi).
* Updated `esbuild`.

## 8.2.4
* Fixed `@size-limit/esbuild-why` for multiple checks (by Homa Wong).

## 8.2.3
* Fixed npm release process.

## 8.2.2
* Fixed npm release process.

## 8.2.1
* Fixed `@size-limit/esbuild-why` package size.

## 8.2
* Added `@size-limit/esbuild-why` plugin (by Homa Wong).
* Fixed peer dependency (by Sébastien Vanvelthem).

## 8.1.2
* Fixed silent mode (by Igor Suvorov).
* Updated `esbuild`.
* Reduced dependencies.

## 8.1.1
* Updated `esbuild`.

## 8.1
* Added `"*"` value support to `import` (by @denkristoffer).

## 8.0.1
* Fixed `config` and `modifyEsbuildConfig` options (by Angelo Ashmore).
* Updated `esbuild`.

## 8.0
* Removed Node.js 12 support.
* Added support for third-party plugins support (by @JounQin).
* Added field with limit to JSON output (by Elliot Westlake).

## 7.0.8
* Fixed peer dependencies.

## 7.0.7
* Fixed plugin versions in presets.

## 7.0.6
* Added `brotlied` note to CLI output (by @azat-io).
* Updated `nanospinner`.

## 7.0.5
* Added `pnpm` examples to migration guide.
* Fixed docs (by @azat-io).

## 7.0.4
* Updated `esbuild`.
* Updated `nanospinner`.

## 7.0.3
* Fixed package size.

## 7.0.2
* Fixed peer dependency ignore in `@size-limit/esbuild`.

## 7.0.1
* Fixed `--save-bundle` arguments with `@size-limit/esbuild`.
* Fixed `ignore` option with `@size-limit/esbuild`.
* Fixed `brotli` option without webpack.
* Fixed error messages.

## 7.0
* Added `@size-limit/esbuild` plugin for better performance (by Artem Tumin).
* Moved `@size-limit/preset-small-lib` to `@size-limit/esbuild`.
* Moved CSS from webpack plugin to `@size-limit/webpack-css` (by Egor Ogarkov).
* Moved `--why` to `@size-limit/webpack-why` (by Egor Ogarkov).

## 6.0.4
* Updated dependencies.

## 6.0.3
* Updated `nanospinner`.

## 6.0.2
* Fixed Statoscope report location (by Sergey Melyukov).

## 6.0.1
* Replaced `mico-spinner` to `nanospinner`.

## 6.0
* Moved to webpack 5 (by Ludovico Fischer).
* Moved from Webpack Bundle Analyzer to Statoscope (by Sergey Melyukov).

## 5.0.5
* Replaced `nanocolors` dependency with `picocolors`.

## 5.0.4
* Replaced `colorette` dependency with `nanocolors`.

## 5.0.3
* Fixed `pnpm` support (by @Tomyail).

## 5.0.2
* Fixed error message on no input files for webpack.
* Fixed plugins loading from optional dependencies (by Edouard Menayde).

## 5.0.1
* Fixed `mico-spinner` dependency range.

## 5.0
* Removed Node.js 10 support.
* Reduced dependencies (by Stsefanovich Kanstantsin & @enemycnt).

## 4.12.0
* Added `.size-limit.cjs` config file support (by Cole Ellison).

## 4.11.0
* Added `modifyWebpackConfig` option (by Lenz Weber).

## 4.10.3
* Updated `optimize-css-assets-webpack-plugin`.

## 4.10.2
* Use `1000` factor for `KB` and `1024` for `KiB` (by Matthias Kunnen).

## 4.10.1
* Fixed output on missed file (by Viktor Pasynok).

## 4.10
* Added `--silent` argument (by Viktor Pasynok).

## 4.9.2
* Fixed plugin loading for mono repository (by John Grishin).

## 4.9.1
* Reduced dependencies by replacing `cosmiconfig` to `lilconfig`.

## 4.9
* Added auto `--highlight-less` for checks with bytes in limit.
* Updated `dual-publish`.

## 4.8
* Added webpack stats support in `--save-bundle` (by Leonard Kinday).

## 4.7
* Added `--highlight-less` argument (by Victor Didenko).

## 4.6.2
* Fixed `peerDependencies` resolving in `import`.
* Fixed Node.js 15 support.

## 4.6.1
* Fixed `peerDependencies` support in `import`.
* Fixed npm 7 support.
* Updated `css-loader` and `file-loader`.

## 4.6
* Added `--hide-passed` argument (by Kristján Oddsson).

## 4.5.7
* Do not show loader in JSON mode (by Billy Vong).

## 4.5.6
* Fix “file was not found” behaviour (by Pavel Pustovalov).

## 4.5.5
* Dropped Node.js 13.0-13.6 support because of ES modules bug in that versions.

## 4.5.4
* Better warning on missed value in CLI argument (by Mikhail Vyrodov).

## 4.5.3
* Fixed `MaxListenersExceededWarning` (by Pavel Pustovalov).
* Fixed `gzipped` note (by Evgeniy Timokhov).

## 4.5.2
* Replace color output library.

## 4.5.1
* Reduce dependencies.
* Improve docs (by Mikhail Bashurov).

## 4.5
* Add `--clean-dir` argument.

## 4.4.5
* Fix Windows support.

## 4.4.4
* Fix Yarn 2 support.

## 4.4.3
* Fix Windows support (by Anton Khlynovskiy).

## 4.4.2
* Update `nanoid`.

## 4.4.1
* Update `file-loader`.
* Add peer dependency to `dual-publish` plugin.

## 4.4
* Add `--watch` support (by @jayhoney).

## 4.3.1
* Fix `import` option.

## 4.3
* Add multiple files support for `import` option.
* Add multiple files support for `import` option.

## 4.2.1
* Fix `dual-publish` error.

## 4.2
* Add `@size-limit/dual-publish` plugin.

## 4.1.1
* Fix `import` option.

## 4.1
* Add tree-shaking support with `import` option (by Brian Schlenker).

## 4.0.2
* Fix `gzip` option plugins test.
* Update `ci-job-number`.

## 4.0.1
* Fix note text (by Pavel Pustovalov).

## 4.0
* Move `size-limit` from `dependencies` to `peerDependencies`.

## 3.0.1
* Add Yarn PnP and Yarn 2 support (by Pavel Pustovalov).

## 3.0
* Drop Node.js 8 support.
* Add Brotli support (by Viktor Pasynok).

## 2.2.4
* Improve `MaxListenersExceededWarning` fix (by Pavel Pustovalov).

## 2.2.3
* Fix `MaxListenersExceededWarning` (by Pavel Pustovalov).

## 2.2.2
* Fix JS API.

## 2.2.1
* Fix warning message (by Alexey Taktarov).

## 2.2
* Add JS API.

## 2.1.6
* Fix `--why` for entries with exceeded limit.
* Fix `--why` for multiple entries.

## 2.1.5
* Fix running time calculation on parallel tasks.
* Fix CI warning text during Puppeteer error.

## 2.1.4
* Add warning for `size-limit` in dependencies.

## 2.1.3
* Fix plugin loading (by Alexandr Antonov).

## 2.1.2
* Update dependencies.

## 2.1.1
* Ignore non `.js` or `.mjs` files in running time.
* Speed up running time calculation.

## 2.1
* Add `--debug` argument.

## 2.0.2
* Fix time limit support.

## 2.0.1
* Fix possible webpack temporal directory name conflict.

## 2.0
* Rewrite tool with modular architecture.

Migration:
1. Update `size-limit` to 2.x version.
2. Run `npx size-limit`.
3. Console will output instructions for installing necessary preset.

## 1.3.8
* Do not download Chrome for Puppeteer if you already have desktop Chrome.

## 1.3.7
* More accurate `--why` (by Anton Korzunov).
* Fix `ignore` and `peerDependencies` (by Anton Korzunov).
* Fix `--no-gzip` argument.

## 1.3.6
* Fix `package.json`-less project support.
* Improve error message on wrong `getSize()` call.
* Fix JSDoc.

## 1.3.5
* Fix CI warning text.

## 1.3.4
* Fix CI warning style.

## 1.3.3
* Fix ignoring scoped packages.

## 1.3.2
* Fix support extension-less `package.main` (by Homa Wong).
* Add warning or Circle CI.

## 1.3.1
* Speed up running time calculation.

## 1.3
* Add `--save-bundle` argument (by Ivan Solovev).

## 1.2
* Add `--json` argument (by Pavel Vostrikov).

## 1.1.2
* Fix running time calculation on `webpack: false`.

## 1.1.1
* Allow to use Size Limit on CI with Node.js <8 tasks.

## 1.1
* Calculate time to download and execute JS.
* Improve CLI UI.

## 1.0.1
* Fix Markdown files support (by Scaria Rex Arun and Kiryl Misachenka).

## 1.0
* Add `.size-limit.json` config name support.

## 0.22
* Drop Node.js 6 support.
* Update inner CLI tools.

## 0.21.1
* Use `css-loader` 2.0 (by Redmond Tran).
* Use `file-loader` 3.0.

## 0.21
* Add support for dynamic filename in custom Webpack config (by Naijia Liu).
* Add `entry` option (by Naijia Liu).

## 0.20.1
* Use `compression-webpack-plugin` 2.0.
* Use `webpack-bundle-analyzer` 3.0.

## 0.20
* Use `package.json#main` as default path for limit.
* Fix custom webpack config support with `resolve` or `resolveLoader` options.

## 0.19.3
* Update `file-loader` and `style-loader`.

## 0.19.2
* Fix `ignore` option (by Jayden Seric).

## 0.19.1
* Use `style-loader` 0.22.

## 0.19
* Add `ignore` option to config.

## 0.18.5
* Fix absolute path support.

## 0.18.4
* Update dependencies.
* Fix documentation.

## 0.18.3
* Use `read-pkg-up` 4.x.
* Remove development config from `package.json`.

## 0.18.2
* Fix size with new webpack.

## 0.18.1
* Move development config files from npm package.

## 0.18
* Add `.size-limit.js` config support (by Olivier Tassinari).

## 0.17.1
* Use `cosmiconfig` 5.x.
* Improve CI (by Daniel Ruf).

## 0.17
* Remove deprecated limit CLI API and add `--limit` argument.

## 0.16.2
* Fix `peerDependencies` and `--why` (by Bogdan Chadkin).

## 0.16.1
* Allow to use Size Limit in CI with Node.js 4.

## 0.16
* `getSize()` now returns `{ gzip, parsed }` (by Bogdan Chadkin).
* Improve size calculation accuracy (by Bogdan Chadkin).
* Array support in the `path` (by Bogdan Chadkin).

## 0.15.2
* Improve performance (by Bogdan Chadkin).

## 0.15.1
* Allow to use Size Limit in CI with Node.js 4.

## 0.15
* Remove Node.js 4 support.
* Use `webpack` 4.0 (by Jayden Seric).
* Use `globby` 8.0.

## 0.14.1
* Use `cosmiconfig` 4.0.
* Use `yargs` 11.0.

## 0.14
* Add `name` option to config.
* Add `gzip` option to config.

## 0.13.2
* Use `globby` 7.0.

## 0.13.1
* Allow to use Size Limit without `package.json`.

## 0.13
* Add `.size-limit` config support (by Vladimir Borovik).

## 0.12.1
* Fix dependency resolving with custom webpack config (by Sivan Mehta).

## 0.12
* Add custom webpack config support (by Sivan Mehta).

## 0.11.6
* Fix CLI messages (by @mute).

## 0.11.5
* Better error message on `--why` with `"webpack": false`.

## 0.11.4
* Update `yargs`.

## 0.11.3
* Better error message on wrong config.
* Fix English in config error messages (by Tim Marinin).

## 0.11.2
* Show config example in config error messages.
* Better error message on wrong config.

## 0.11.1
* Better error message on missed file in legacy CLI.

## 0.11
* Ignore size of `peerDependencies`.

## 0.10
* Add CSS files support (by Sebastian Werner).
* Add support for more static files types (by Sebastian Werner).

## 0.9
* Use UglifyJS 3 to support ES2016 out of box.
* Add argument and option to disable webpack.
* Deprecate argument and option for Babili.
* Deprecate limit in CLI arguments.
* Deprecate old `"sizeLimit"` section name.
* Better error messages style.
* Clean npm package from test files.

## 0.8.4
* Fix error messages text (by Alexandr Subbotin).

## 0.8.3
* Improve error messages style.

## 0.8.2
* Better output for projects with multiple limits.
* Fix multiple limits support in `--why`.

## 0.8.1
* Improve CLI help (by Peter deHaan).

## 0.8
* Add `size-limit` configuration section support.

## 0.7.1
* Fix multiline error messages in CLI.
* Do not load `node-zopfli` as loose dependency.

## 0.7
* Add glob pattern support to `sizeLimit` section.

## 0.6.2
* Better project name in Webpack Bundle Analyzer.

## 0.6.1
* Load images by `file-loader`.

## 0.6
* Add `sizeLimit` configuration section support.

## 0.5.1
* Use gzip sizes in Webpack Bundle Analyzer.

## 0.5
* Add Semaphore support.

## 0.4
* Add CircleCI support.

## 0.3.2
* Fix bundle name in `--why` mode.
* Move gzip calculation inside webpack.

## 0.3.1
* Use `read-pkg-up` to find `package.json`.
* Use `ci-job-number` to detect CI job number.

## 0.3
* Run only on first CI job to save CI resources.

## 0.2
* Add `--babili` argument.
* Use Chalk 2.

## 0.1.3
* Fix CLI text (by Yaroslav Markin).

## 0.1.2
* Fix CLI text (by Marais Rossouw).

## 0.1.1
* Fix parsing `B` unit without kilo/mega prefix.

## 0.1
* Initial release.
