let ora = require('ora')

module.exports = async function calc (plugins, config) {
  async function exec (step) {
    for (let plugin of plugins.list) {
      let spinner
      if (plugin['wait' + step]) {
        spinner = ora(plugin['wait' + step]).start()
      }
      if (plugin['step' + step]) {
        process.setMaxListeners(config.checks.reduce((all, check) => {
          return all + check.path.length
        }, 0))
        try {
          await Promise.all(config.checks.map(i => {
            return plugin['step' + step](config, i)
          }))
        } catch (e) {
          if (spinner) spinner.fail()
          throw e
        }
      }
      if (spinner) spinner.succeed()
    }
  }

  try {
    for (let i = 0; i <= 100; i++) await exec(i)
  } finally {
    exec('finally')
  }
  for (let check of config.checks) {
    if (typeof check.sizeLimit !== 'undefined') {
      check.passed = check.sizeLimit >= check.size
    }
    if (typeof check.timeLimit !== 'undefined') {
      check.passed = check.timeLimit >= check.time
    }
  }
  config.failed = config.checks.some(i => i.passed === false)
}
