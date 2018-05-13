const path = require('path')

const getSize = require('../')

function fixture (name) {
  return path.join(__dirname, 'fixtures', `${ name }.js`)
}

function trim (num) {
  // round number with assumption
  return Math.floor(num / 20) * 20
}

it('returns 0 for parsed and gzip empty project', () => {
  return getSize(fixture('unlimit/empty')).then(size => {
    expect(size).toEqual({ parsed: 0, gzip: 0 })
  })
})

it('shows project parsed and gzip sizes', () => {
  return getSize(fixture('bad/index')).then(size => {
    expect(size).toEqual({ parsed: 7031, gzip: 2405 })
  })
})

it('accepts array', () => {
  return getSize([fixture('bad/index'), fixture('good/index')]).then(size => {
    expect(size).toEqual({ parsed: 7081, gzip: 2422 })
  })
})

it('returns error', () => {
  return getSize(fixture('unknown')).catch(e => {
    expect(e.message).toContain('Can\'t resolve')
  })
})

it('supports ES2016', () => {
  return getSize(fixture('es2016/index')).then(size => {
    expect(size).toEqual({ parsed: 47, gzip: 34 })
  })
})

it('support images', () => {
  return getSize(fixture('img/index')).then(size => {
    expect(size).toEqual({ parsed: 89, gzip: 53 })
  })
})

it('supports CSS', () => {
  return getSize(fixture('css/index')).then(size => {
    expect(trim(size.gzip)).toEqual(2340)
  })
})

it('supports CSS modules', () => {
  return getSize(fixture('cssmodules/index')).then(size => {
    expect(trim(size.gzip)).toEqual(2360)
  })
})

it('removes non-production code', () => {
  return getSize(fixture('multiple/production')).then(size => {
    expect(size).toEqual({ parsed: 14, gzip: 8 })
  })
})

it('ignores dependencies on request', () => {
  return getSize(fixture('peer/index'), { ignore: ['redux'] }).then(size => {
    expect(size).toEqual({ parsed: 220, gzip: 92 })
  })
})

it('disables webpack on request', () => {
  return getSize([
    fixture('bad/index'), fixture('es2016/index')
  ], { webpack: false }).then(size => {
    expect(size).toEqual({ parsed: 82, gzip: 122 })
  })
})

it('disables gzip on request', () => {
  return getSize([fixture('bad/index')], { gzip: false }).then(size => {
    expect(size).toEqual({ parsed: 7031 })
  })
})

it('disables gzip and webpack on request', () => {
  return getSize([
    fixture('bad/index')
  ], { webpack: false, gzip: false }).then(size => {
    expect(size).toEqual({ parsed: 31 })
  })
})

it('uses custom webpack config', () => {
  return getSize(fixture('webpack-config/index'), {
    config: fixture('webpack-config/webpack.config')
  }).then(size => {
    expect(size).toEqual({ parsed: 2523 })
  })
})
