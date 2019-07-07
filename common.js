let bytes = require('bytes')

module.exports = {
  formatTime,
  formatBytes,
  capitalize
}

function formatTime (seconds) {
  if (seconds >= 1) {
    return Math.ceil(seconds * 10) / 10 + ' s'
  } else {
    return Math.ceil(seconds * 1000) + ' ms'
  }
}

function formatBytes (size) {
  return bytes.format(size, { unitSeparator: ' ' })
}

function capitalize (str) {
  return str[0].toUpperCase() + str.slice(1)
}
