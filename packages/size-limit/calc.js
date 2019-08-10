module.exports = async function calc (plugins, config) {
  async function exec (step) {
    for (let plugin of plugins.list) {
      if (plugin[step]) {
        await Promise.all(config.checks.map(i => plugin[step](config, i)))
      }
    }
  }

  try {
    for (let i = 0; i <= 100; i++) await exec(`step${ i }`)
  } finally {
    exec('finally')
  }
  for (let check of config.checks) {
    if (check.sizeLimit) {
      check.passed = check.sizeLimit >= check.size
    }
    if (check.timeLimit) {
      check.passed = check.timeLimit >= check.size
    }
  }
  config.failed = config.checks.some(i => i.passed === false)
}
