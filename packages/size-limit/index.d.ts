/**
 * Represents the options for the size-limit check.
 */
export interface Check {
  /**
   * With `false` it will disable any compression.
   */
  brotli?: boolean

  /**
   * Path to `stats.json` from another build to compare (when `--why` is using).
   */
  compareWith?: string

  /**
   * A path to a custom webpack, esbuild or rolldown config.
   */
  config?: string

  disableModuleConcatenation?: boolean

  /**
   * Plugin npm package names to skip for this check.
   * For example: `["@size-limit/webpack"]`, `["@size-limit/esbuild"]`,
   * `["@size-limit/rolldown"]`, or `["@size-limit/time"]`.
   */
  disablePlugins?: string[]

  /**
   * When using a custom bundler config, an entry point could be given.
   * It could be a string or an array of strings. By default,
   * the total size of all entry points will be checked.
   */
  entry?: string | string[]

  /**
   * With `true` it will use Gzip compression and disable Brotli compression.
   */
  gzip?: boolean

  hidePassed?: boolean

  highlightLess?: boolean

  /**
   * An array of files and dependencies to exclude from
   * the project size calculation.
   */
  ignore?: string[]

  /**
   * Partial import to test tree-shaking. It could be `"{ lib }"` to test
   * `import { lib } from 'lib'`, `*` to test all exports, or
   * `{ "a.js": "{ a }", "b.js": "{ b }" }` to test multiple files.
   */
  import?: string | Record<string, string>

  /**
   * Size or time limit for files from the path option.
   * It should be a string with a number and unit, separated by a space.
   * Format: `100 B`, `10 kB`, `500 ms`, `1 s`.
   */
  limit?: string

  /**
   * (`.size-limit.js` only) Function that can be used to do last-minute
   * changes to the esbuild config, like adding a plugin. Annotate the
   * parameter with `BuildOptions` to read properties.
   */
  modifyEsbuildConfig?: (config: object) => object

  /**
   * (`.size-limit.js` only) Function that can be used to do last-minute
   * changes to the rolldown config, like adding a plugin. Annotate the
   * parameter with `RolldownOptions` to read properties.
   */
  modifyRolldownConfig?: (config: object) => object

  /**
   * (`.size-limit.js` only) Function that can be used to do last-minute
   * changes to the webpack config, like adding a plugin. Annotate the
   * parameter with `Configuration` to read properties.
   */
  modifyWebpackConfig?: (config: object) => object

  module?: boolean

  /**
   * The name of the current section.
   * It will only be useful if you have multiple sections.
   */
  name?: string

  /**
   * Relative paths to files. The only mandatory option.
   * It could be a path `"index.js"`, a
   * {@link https://nodejs.org/api/fs.html#fspromisesglobpattern-options pattern}
   * `"dist/app-*.js"` or an array
   * `["index.js", "dist/app-*.js", "!dist/app-exclude.js"]`.
   */
  path: string | string[]

  /**
   * With `false` it will disable rolldown.
   */
  rolldown?: boolean

  /**
   * With `false` it will disable calculating running time.
   */
  running?: boolean

  /**
   * Custom UI reports list.
   *
   * @see {@link https://github.com/statoscope/statoscope/tree/master/packages/webpack-plugin#optionsreports-report Statoscope docs}
   */
  uiReports?: object

  /**
   * With `false` it will disable webpack.
   */
  webpack?: boolean

  /**
   * Options for `@size-limit/time` plugin.
   */
  time?: TimeOptions
}

/**
 * Represents the options for the size-limit check time property to customize `@size-limit/time` plugin.
 */
export interface TimeOptions {
  /**
   * A network speed to calculate loading time of files.
   * It should be a string with a number and unit, separated by a space.
   * Format: `100 B`, `10 kB`.
   * @default "50 kB"
   */
  networkSpeed?: string

  /**
   * Delay for calculating loading time that simulates network latency
   * It should be a string with a number and unit, separated by a space.
   * Format: `500 ms`, `1 s`.
   * @default: "0"
   */
  latency?: string

  /**
   * A message for loading time details
   * @default "on slow 3G"
   */
  loadingMessage?: string
}

export type SizeLimitConfig = Check[]

/**
 * A hook called by Size Limit. It is called once per check which has not
 * disabled the plugin with the `disablePlugins` option.
 */
export type PluginHook = (
  config: PluginConfig,
  check: PluginCheck
) => Promise<void> | void

/**
 * Numbers of the steps that Size Limit runs, from `0` to `100` inclusive:
 * `calc()` calls `step0`, `step1`, … `step100` in order, and `wait0` … `wait100`
 * name the spinner of the matching step.
 */
export type PluginStep =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19
  | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29
  | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39
  | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49
  | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59
  | 60 | 61 | 62 | 63 | 64 | 65 | 66 | 67 | 68 | 69
  | 70 | 71 | 72 | 73 | 74 | 75 | 76 | 77 | 78 | 79
  | 80 | 81 | 82 | 83 | 84 | 85 | 86 | 87 | 88 | 89
  | 90 | 91 | 92 | 93 | 94 | 95 | 96 | 97 | 98 | 99
  | 100

type PluginSteps = { [step in `step${PluginStep}`]?: PluginHook }
type PluginWaits = { [wait in `wait${PluginStep}`]?: string }

/**
 * Size Limit plugin.
 *
 * A plugin package must export an array of plugins as its default export and
 * have a name starting with `@size-limit/` or `size-limit-` to be loaded.
 *
 * ```ts
 * import type { Plugin } from 'size-limit'
 *
 * export default [
 *   {
 *     name: 'size-limit-example',
 *     async step20(config, check) {
 *       // Measure the check and set `check.size`
 *     },
 *     wait20: 'Measuring'
 *   }
 * ] satisfies Plugin[]
 * ```
 */
export interface Plugin extends PluginSteps, PluginWaits {
  /**
   * NPM package name of the plugin, for example `@size-limit/file`.
   * It is also the name to use in the `disablePlugins` option.
   */
  name: string

  /**
   * Called before the first step.
   */
  before?: PluginHook

  /**
   * Called after the last step, even when a step has thrown.
   */
  finally?: PluginHook
}

/**
 * Configuration of the current run, passed to the plugin hooks.
 */
export interface PluginConfig {
  /**
   * Directory the checks are resolved from. It is set only when the config
   * comes from a config file.
   */
  cwd?: string

  /**
   * Checks to run.
   */
  checks: PluginCheck[]

  /**
   * Path to the config file relative to `cwd`. It is set only when the config
   * comes from a config file.
   */
  configPath?: string

  /**
   * Absolute path to the directory from the `--save-bundle` argument.
   */
  saveBundle?: string

  /**
   * With `true` the `saveBundle` directory will be cleaned before the build,
   * set by the `--clean-dir` argument.
   */
  cleanDir?: boolean

  /**
   * Absolute path to `stats.json` from another build to compare,
   * set by the `--compare-with` argument.
   */
  compareWith?: string

  /**
   * Package name, set by the `--why` argument.
   */
  project?: string

  /**
   * With `true` it will open the bundle analyzer, set by the `--why` argument.
   */
  why?: boolean

  /**
   * With `true` at least one check has failed. It is set after the last step.
   */
  failed?: boolean

  /**
   * With `true` at least one check has missed all of its files. It is set after
   * the last step.
   */
  missed?: boolean
}

/**
 * The check passed to the plugin hooks: the check from the config after Size
 * Limit has resolved it, together with the fields added by the plugins which
 * have already run.
 */
export interface PluginCheck
  extends Omit<Check, 'entry' | 'import' | 'path' | 'time'> {
  /**
   * Path of the check before it was resolved into `files`. It is not set when
   * the check is defined by `entry`.
   */
  path?: string | string[]

  /**
   * Absolute paths of the files to measure, after globbing. It is not set when
   * the check is defined by `entry` and a bundler plugin provides `bundles`.
   */
  files?: string[]

  /**
   * Entry points, normalized into an array.
   */
  entry?: string[]

  /**
   * Partial imports to test tree-shaking, keyed by the absolute path of a file.
   */
  import?: Record<string, string>

  /**
   * Options of `@size-limit/time` after normalization: `latency` in seconds and
   * `networkSpeed` in bytes.
   */
  time?: Omit<TimeOptions, 'latency' | 'networkSpeed'> & {
    latency?: number
    networkSpeed?: number
  }

  /**
   * Size limit in bytes, parsed from the `limit` option.
   */
  sizeLimit?: number

  /**
   * Time limit in seconds, parsed from the `limit` option.
   */
  timeLimit?: number

  /**
   * With `false` the check has failed. It is set after the last step.
   */
  passed?: boolean

  /**
   * With `true` the check has missed all of its files. It is set after the last
   * step.
   */
  missed?: boolean

  /**
   * With `false` it will disable esbuild.
   */
  esbuild?: boolean

  /**
   * Total size of `bundles` or `files` in bytes, set by `@size-limit/file`.
   */
  size?: number

  /**
   * Built files to measure instead of `files`, set by a bundler plugin.
   */
  bundles?: string[]

  /**
   * esbuild build options, set by `@size-limit/esbuild`.
   * Use `esbuild` types for its exact shape.
   */
  esbuildConfig?: Record<string, unknown>

  /**
   * esbuild build metadata, set by `@size-limit/esbuild`.
   * Use `esbuild` types for its exact shape.
   */
  esbuildMetafile?: Record<string, unknown>

  /**
   * Directory with the esbuild output, set by `@size-limit/esbuild`.
   */
  esbuildOutfile?: string

  /**
   * Path to the esbuild bundle analyzer report,
   * set by `@size-limit/esbuild-why`.
   */
  esbuildVisualizerFile?: string

  /**
   * webpack configuration, set by `@size-limit/webpack`.
   * Use `webpack` types for its exact shape.
   */
  webpackConfig?: Record<string, unknown>

  /**
   * Directory with the webpack output, set by `@size-limit/webpack`.
   */
  webpackOutput?: string

  /**
   * rolldown configuration, set by `@size-limit/rolldown`.
   * Use `rolldown` types for its exact shape.
   */
  rolldownConfig?: Record<string, unknown>

  /**
   * Directory with the rolldown output, set by `@size-limit/rolldown`.
   */
  rolldownOutput?: string

  /**
   * Path to the rolldown bundle analyzer report,
   * set by `@size-limit/rolldown-why`.
   */
  rolldownVisualizerFile?: string

  /**
   * Time to load the files, in seconds, set by `@size-limit/time`.
   */
  loadTime?: number

  /**
   * Time to execute the files, in seconds, set by `@size-limit/time`.
   */
  runTime?: number

  /**
   * Total time of the check, in seconds, set by `@size-limit/time`.
   */
  totalTime?: number
}

/**
 * Run Size Limit and return the result.
 *
 * @param plugins The list of plugins like `@size-limit/time`
 * @param files Path to files or internal config
 * @return Project size
 */
declare function sizeLimitAPI(
  plugins: readonly (Plugin | readonly Plugin[])[],
  files: string[] | object
): Promise<object>

export default sizeLimitAPI
