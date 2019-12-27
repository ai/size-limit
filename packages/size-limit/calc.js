module.exports = async function calc (plugins, config) {
  async function exec (step) {
    for (let plugin of plugins.list) {
      if (plugin[step]) {
        let countOfFiles = config.checks.reduce(
          (result, check) => result + check.path.length,
          0
        )
        process.setMaxListeners(countOfFiles)
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
    if (typeof check.sizeLimit !== 'undefined') {
      check.passed = check.sizeLimit >= check.size
    }
    if (typeof check.timeLimit !== 'undefined') {
      check.passed = check.timeLimit >= check.time
    }
  }
  config.failed = config.checks.some(i => i.passed === false)
}
