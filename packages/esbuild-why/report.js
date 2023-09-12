import { isValidFilename } from './valid-filename.js'

export function getReportName(config, check) {
  if (config.checks.length === 1) return `esbuild-why.html`
  if (isValidFilename(check.name)) return `esbuild-why-${check.name}.html`
  let index = config.checks.findIndex(c => c.name === check.name)
  return `esbuild-why-${index + 1}.html`
}
