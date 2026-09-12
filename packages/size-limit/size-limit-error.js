function pluginList(mods) {
  let names = mods.map(i => `*@size-limit/${i}*`)
  let last = names.pop()
  if (names.length === 0) return last
  return `${names.join(', ')} or ${last}`
}

const MESSAGES = {
  argWithoutAnalyzer: (arg, bundler, analyzer = `${bundler}-${arg}`) =>
    `Argument *--${arg}* works only with *@size-limit/${bundler}* plugin` +
    ` and *@size-limit/${analyzer}* plugin. You can add Bundle ` +
    `Analyzer to you own bundler.`,
  argWithoutAnotherArg: (arg, anotherArg) =>
    `Argument *--${arg}* works only with *--${anotherArg}* argument`,
  argWithoutParameter: (arg, parameter) =>
    `Missing parameter *${parameter}* for *--${arg}* argument`,
  argWithoutPlugins: (arg, ...mods) =>
    `Argument *--${arg}* needs ${pluginList(mods)} plugin`,
  bundleDirNotEmpty: dir =>
    `The directory *${dir}* is not empty. ` +
    'Pass *--clean-dir* if you want to remove it',
  cmdError: (cmd, error) => (error ? `${cmd} error: ${error}` : `${cmd} error`),
  disablePluginsNotArray: () =>
    'The *disablePlugins* in Size Limit config ' +
    'must be *an array of strings*',
  emptyConfig: () => 'Size Limit config must *not be empty*',
  entryNotString: () =>
    'The *entry* in Size Limit config ' +
    'must be *a string* or *an array of strings*',
  missedPlugin: mod => `Add *@size-limit/${mod}* plugin to Size Limit`,
  multiPluginlessConfig: (opt, ...mods) =>
    `Config option *${opt}* needs ${pluginList(mods)} plugin`,
  noArrayConfig: () => 'Size Limit config must contain *an array*',
  noConfig: () => 'Create Size Limit config in *package.json*',
  noObjectCheck: () => 'Size Limit config array should contain *only objects*',
  noPackage: () =>
    'Size Limit didn’t find *package.json*. ' +
    'Create npm package and run Size Limit there.',
  pathNotString: () =>
    'The *path* in Size Limit config ' +
    'must be *a string* or *an array of strings*',
  pluginlessConfig: (opt, mod) =>
    `Config option *${opt}* needs *@size-limit/${mod}* plugin`,
  timeWithoutPlugin: () => 'Add *@size-limit/time* plugin to use time limit',
  unknownArg: arg =>
    `Unknown argument *${arg}*. Check command for typo and read docs.`,
  unknownEntry: entry =>
    `Size Limit didn’t find *${entry}* entry in the custom bundler config`,
  unknownOption: opt =>
    `Unknown option *${opt}* in config. Check Size Limit docs and version.`
}

const ADD_CONFIG_EXAMPLE = {
  emptyConfig: true,
  noArrayConfig: true,
  noConfig: true,
  noObjectCheck: true,
  pathNotString: true
}

export class SizeLimitError extends Error {
  constructor(type, ...args) {
    super(MESSAGES[type](...args))
    this.name = 'SizeLimitError'
    if (ADD_CONFIG_EXAMPLE[type]) {
      this.example =
        '  "size-limit": [\n' +
        '    {\n' +
        '      "path": "dist/bundle.js",\n' +
        '      "limit": "10 kB"\n' +
        '    }\n' +
        '  ]\n'
    }
  }
}
