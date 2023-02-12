let { getReportName } = require('../report')

let plain = {
  name: 'plain'
}
let withPlus = {
  name: 'with+'
}
let aDotB = {
  name: 'a.b'
}
let withSlash = {
  name: 'a/index.js'
}
let withBackSlash = {
  name: 'b\\index.js'
}
let config = {
  checks: [plain, withPlus, aDotB, withSlash, withBackSlash]
}

it('returns name if the name is a valid file name', () => {
  expect(getReportName(config, plain)).toEqual(`esbuild-why-plain.html`)
  expect(getReportName(config, withPlus)).toEqual(`esbuild-why-with+.html`)
  expect(getReportName(config, aDotB)).toEqual(`esbuild-why-a.b.html`)
})

it('returns plain name if there is only one check', () => {
  expect(getReportName({ checks: [plain] }, plain)).toEqual(`esbuild-why.html`)
  expect(getReportName({ checks: [withSlash] }, withSlash)).toEqual(`esbuild-why.html`)
})

it('returns one-based index if name is not a valid file name', () => {
  expect(getReportName(config, withSlash)).toEqual(`esbuild-why-4.html`)
  expect(getReportName(config, withBackSlash)).toEqual(`esbuild-why-5.html`)
})
