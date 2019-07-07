const globby = require('globby')
const { codechecks } = require('@codechecks/client') // eslint-disable-line
const markdownTable = require('markdown-table')
const markdownEscape = require('markdown-escape')

let { formatTime, formatBytes } = require('./common')
const getSize = require('.')

const ARTIFACT_NAME = 'size-limit'

module.exports.default = async function sizeLimitCodecheck (options = []) {
  let artifact = {}

  await Promise.all(
    options.files.map(async f => {
      let glob = f.path

      let result = await getSize(
        await globby(glob, {
          cwd: codechecks.context.workspaceRoot,
          absolute: true
        }),
        { webpack: false }
      )

      artifact[glob] = result
    })
  )

  await codechecks.saveValue(ARTIFACT_NAME, artifact)

  if (codechecks.isPr()) {
    let baseArtifact = await codechecks.getValue(ARTIFACT_NAME)

    let comparison = compareArtifacts(artifact, baseArtifact)

    let table = [
      ['Path', 'Size', 'Loading time (3g)',
        'Running time (Snapdragon)', 'Total time'],
      ...comparison.map(row => {
        console.log(row)
        return [
          markdownEscape(row.path),
          `${ formatBytes(row.gzip.value) } (${
            getComparisonChange(row.gzip) })`,
          `${ formatTime(row.loading.value) } (${
            getComparisonChange(row.loading) })`,
          `${ formatTime(row.running.value) } (${
            getComparisonChange(row.running) })`,
          formatTime(row.running.value + row.loading.value)
        ]
      })
    ]

    let overallSizeChange = comparison.reduce((a, c) => c.gzip.change + a, 0)
    let overallSize = comparison.reduce((a, c) => c.gzip.value + a, 0)
    let overallPercChange = overallSizeChange / overallSize * 100
    let formattedValue =
      (Math.sign(overallPercChange) * Math.ceil(
        Math.abs(overallPercChange) * 100)
      ) / 100

    await codechecks.report({
      name: 'Size report',
      status: 'success',
      shortDescription:
        formattedValue >= 0 ? `Size increased by ${
          formattedValue } %` : `Size decreased by ${
          formattedValue } %`,
      longDescription: markdownTable(table)
    })
  }
}

function compareArtifacts (newArtifact, oldArtifact) {
  let allKeys = [...new Set([
    ...Object.keys(newArtifact),
    ...Object.keys(oldArtifact)
  ])]

  let comparison = []
  for (let key of allKeys) {
    let newValue = newArtifact[key] || {}
    let oldValue = oldArtifact[key] || {}

    let result = {
      path: key,
      gzip: compare(newValue, oldValue, 'gzip'),
      loading: compare(newValue, oldValue, 'loading'),
      running: compare(newValue, oldValue, 'running')
    }

    comparison.push(result)
  }

  return comparison
}

function compare (newValue, oldValue, key) {
  return {
    value: newValue[key] || 0,
    change: (newValue[key] || 0) - (oldValue[key] || 0),
    status: getStatus(oldValue[key], newValue[key])
  }
}

function getComparisonChange (comparison) {
  if (comparison.value === 0) {
    return '-100%'
  }

  let value = (comparison.change / comparison.value) * 100
  let formattedValue = (Math.sign(value) * Math.ceil(
    Math.abs(value) * 100)) / 100

  if (value > 0) {
    return `+${ formattedValue }% 🔺`
  } else if (value === 0) {
    return `${ formattedValue }%`
  } else {
    return `${ formattedValue }% 🔽`
  }
}

function getStatus (oldValue, newValue) {
  if (newValue === undefined) {
    return 'removed'
  }
  if (oldValue === undefined) {
    return 'new'
  }

  return 'changed'
}
