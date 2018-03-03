const path = require('path')

const getSize = require('../')

function fixture (name) {
  return path.join(__dirname, 'fixtures', `${ name }.js`)
}

function trim (num) {
  return Math.floor(num / 10) * 10
}

it('returns 0 for minified empty project', () => {
  return getSize(fixture('unlimit/empty'), { gzip: false }).then(size => {
    expect(size).toEqual(0)
  })
})

it('returns 0 for gziped empty project', () => {
  return getSize(fixture('unlimit/empty')).then(size => {
    expect(size).toEqual(0)
  })
})

it('shows project size', () => {
  return getSize(fixture('bad/index')).then(size => {
    expect(size).toEqual(2282)
  })
})

it('accepts array', () => {
  return getSize([fixture('bad/index'), fixture('good/index')]).then(size => {
    expect(size).toEqual(2296)
  })
})

it('returns error', () => {
  return getSize(fixture('unknown')).catch(e => {
    expect(e.message).toContain('Can\'t resolve')
  })
})

it('supports ES2016', () => {
  return getSize(fixture('es2016/index')).then(size => {
    expect(size).toEqual(34)
  })
})

it('support images', () => {
  return getSize(fixture('img/index')).then(size => {
    expect(size).toEqual(53)
  })
})

it('supports CSS', () => {
  return getSize(fixture('css/index')).then(size => {
    expect(trim(size)).toEqual(2330)
  })
})

it('supports CSS modules', () => {
  return getSize(fixture('cssmodules/index')).then(size => {
    expect(trim(size)).toEqual(2360)
  })
})

it('removes non-production code', () => {
  return getSize(fixture('multiple/production')).then(size => {
    expect(size).toEqual(8)
  })
})

it('ignores dependencies on request', () => {
  return getSize(fixture('peer/index'), { ignore: ['redux'] }).then(size => {
    expect(size).toEqual(97)
  })
})

it('disables webpack on request', () => {
  return getSize([
    fixture('bad/index'), fixture('es2016/index')
  ], { webpack: false }).then(size => {
    expect(size).toEqual(122)
  })
})

it('disables gzip on request', () => {
  return getSize([fixture('bad/index')], { gzip: false }).then(size => {
    expect(size).toEqual(6462)
  })
})

it('disables gzip and webpack on request', () => {
  return getSize([
    fixture('bad/index')
  ], { webpack: false, gzip: false }).then(size => {
    expect(size).toEqual(31)
  })
})

it('uses custom webpack config', () => {
  return getSize(fixture('webpack-config/index'), {
    config: fixture('webpack-config/webpack.config')
  }).then(size => {
    expect(size).toEqual(2523)
  })
})
