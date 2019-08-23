# Change Log
This project adheres to [Semantic Versioning](http://semver.org/).

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

#### Migrating from v1:
1. Install v2.x in your project
2. Run `npx size-limit` or `yarn size-limit`
3. Console will output instructions for installing necessary preset

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
