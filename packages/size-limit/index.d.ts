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
   * A path to a custom webpack config.
   */
  config?: string

  disableModuleConcatenation?: boolean

  /**
   * When using a custom webpack config, a webpack entry could be given.
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

  modifyEsbuildConfig?: (config?: any) => any

  /**
   * (`.size-limit.js` only) Function that can be used to do last-minute
   * changes to the webpack config, like adding a plugin.
   */
  modifyWebpackConfig?: (config?: any) => any

  module?: boolean

  /**
   * The name of the current section.
   * It will only be useful if you have multiple sections.
   */
  name?: string

  /**
   * Relative paths to files. The only mandatory option.
   * It could be a path `"index.js"`, a
   * {@link https://github.com/SuperchupuDev/tinyglobby pattern}
   * `"dist/app-*.js"` or an array
   * `["index.js", "dist/app-*.js", "!dist/app-exclude.js"]`.
   */
  path: string | string[]

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
  latency: string

  /**
   * A message for loading time details
   * @default "on slow 3G"
   */
  loadingMessage?: string
}

export type SizeLimitConfig = Check[]

/**
 * Any function with any arguments.
 */
type AnyFunction = (...args: any[]) => any

/**
 * Run Size Limit and return the result.
 *
 * @param plugins   The list of plugins like `@size-limit/time`
 * @param  files Path to files or internal config
 * @return Project size
 */
declare function sizeLimitAPI(
  plugins: AnyFunction[],
  files: string[] | object
): Promise<object>

export default sizeLimitAPI
