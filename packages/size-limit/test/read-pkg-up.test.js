const path = require('path')

let readPkgUp = require('../read-pkg-up')

describe(`read-pkg-up`, () => {
  it('finds package.json of the same package', async () => {
    let cwd = path.join(__dirname, 'fixtures/simple')
    let result = await readPkgUp(cwd)
    expect(result.packageJson.name).toBe('file')
    expect(result.path).toBe(path.join(cwd, 'package.json'))
  })

  it('finds package.json of the size-limit', async () => {
    let cwd = path.join(__dirname, 'fixtures')
    let result = await readPkgUp(cwd)
    expect(result.path).toBe(path.join(__dirname, '..', 'package.json'))
  })

  it('package.json should be undefined if no package.json was found', async () => {
    expect(await readPkgUp('/')).toBeUndefined()
  })
})
