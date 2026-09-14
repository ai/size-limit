const UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
const PARSE_REGEXP = /^([+-]?\d+(?:\.\d+)?) *(?:([kmgtpezy])?(i)?b)?$/i

export function formatBytes(size) {
  let power = 0
  while (Math.abs(size) >= 1000 ** (power + 1) && power < UNITS.length - 1) {
    power += 1
  }
  return parseFloat((size / 1000 ** power).toFixed(2)) + ' ' + UNITS[power]
}

export function parseBytes(value) {
  if (typeof value === 'number') return value
  let match = PARSE_REGEXP.exec(value)
  if (!match) return null
  let [, number, prefix, iec] = match
  let power = prefix ? 'kmgtpezy'.indexOf(prefix.toLowerCase()) + 1 : 0
  return Math.floor(parseFloat(number) * (iec ? 1024 : 1000) ** power)
}
