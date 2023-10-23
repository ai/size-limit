export function isValidFilename(string) {
  if (!string || string.length > 255 || string === '.' || string === '..') {
    return false
  }
  return (
    !/[<>:"/\\|?*\u0000-\u001F]/g.test(string) &&
    !/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(string)
  )
}
