// from https://github.com/sindresorhus/valid-filename/blob/main/index.js
function isValidFilename(string) {
  if (!string || string.length > 255) {
    return false;
  }

  if (filenameReservedRegex().test(string) || windowsReservedNameRegex().test(string)) {
    return false;
  }

  if (string === '.' || string === '..') {
    return false;
  }

  return true;
}

// from https://github.com/sindresorhus/filename-reserved-regex/blob/main/index.js
function filenameReservedRegex() {
  // eslint-disable-next-line no-control-regex
  return /[<>:"/\\|?*\u0000-\u001F]/g;
}

function windowsReservedNameRegex() {
  return /^(con|prn|aux|nul|com\d|lpt\d)$/i;
}

module.exports = { isValidFilename }
