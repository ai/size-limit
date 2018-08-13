let path = require('path')

let getSize = require('../')

function fixture (name) {
  return path.join(__dirname, 'fixtures', `${ name }.js`)
}

function trim (num) {
  // round number with assumption
  return Math.floor(num / 50) * 50
}

it('returns 0 for parsed and gzip empty project', () => {
  return getSize(fixture('unlimit/empty')).then(size => {
    expect(size).toEqual({ gzip: 0, parsed: 0 })
  })
})

it('shows project parsed and gzip sizes', () => {
  return getSize(fixture('bad/index')).then(size => {
    expect(size).toEqual({ gzip: 2368, parsed: 7018 })
  })
})

it('accepts array', () => {
  return getSize([fixture('bad/index'), fixture('good/index')]).then(size => {
    expect(size).toEqual({ gzip: 2383, parsed: 7053 })
  })
})

it('returns error', () => {
  return getSize(fixture('unknown')).catch(e => {
    expect(e.message).toContain('Can\'t resolve')
  })
})

it('supports ES2016', () => {
  return getSize(fixture('es2016/index')).then(size => {
    expect(size).toEqual({ gzip: 25, parsed: 32 })
  })
})

it('support images', () => {
  return getSize(fixture('img/index')).then(size => {
    expect(size).toEqual({ gzip: 43, parsed: 76 })
  })
})

it('supports CSS', () => {
  return getSize(fixture('css/index')).then(size => {
    expect(trim(size.gzip)).toEqual(2300)
  })
})

it('supports CSS modules', () => {
  return getSize(fixture('cssmodules/index')).then(size => {
    expect(trim(size.gzip)).toEqual(2350)
  })
})

it('removes non-production code', () => {
  return getSize(fixture('multiple/production')).then(size => {
    expect(size).toEqual({ gzip: 1, parsed: 3 })
  })
})

it('ignores dependencies on request', () => {
  return getSize(fixture('peer/index'), { ignore: ['redux'] }).then(size => {
    expect(size).toEqual({ gzip: 22, parsed: 83 })
  })
})

it('disables webpack on request', () => {
  return getSize([
    fixture('bad/index'), fixture('es2016/index')
  ], { webpack: false }).then(size => {
    expect(size).toEqual({ gzip: 93, parsed: 53 })
  })
})

it('disables gzip on request', () => {
  return getSize([fixture('bad/index')], { gzip: false }).then(size => {
    expect(size).toEqual({ parsed: 7018 })
  })
})

it('disables gzip and webpack on request', () => {
  return getSize([
    fixture('bad/index')
  ], { webpack: false, gzip: false }).then(size => {
    expect(size).toEqual({ parsed: 17 })
  })
})

it('uses custom webpack config', () => {
  return getSize(fixture('webpack-config/index'), {
    config: fixture('webpack-config/webpack.config')
  }).then(size => {
    expect(size).toEqual({ parsed: 3085 })
  })
})
