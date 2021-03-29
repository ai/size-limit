let createReporter = require('../create-reporter')

function results(types, config, isJSON = false, isSilentMode = false) {
  let stdout = ''
  let plugins = {
    has(type) {
      return types.includes(type)
    }
  }
  let process = {
    stdout: {
      write(str) {
        stdout += str
      }
    }
  }
  let reporter = createReporter(process, isJSON, isSilentMode)
  reporter.results(plugins, config)
  return stdout
}

it('renders results', () => {
  expect(
    results(['webpack', 'time'], {
      checks: [
        {
          name: 'limitless',
          size: 10,
          config: 'a',
          loadTime: 0.1,
          runTime: 0.5,
          time: 0.6
        },
        {
          name: 'size',
          size: 102400,
          sizeLimit: 102400,
          loadTime: 1,
          runTime: 2,
          time: 3,
          passed: true
        },
        {
          name: 'time',
          size: 102400,
          gzip: false,
          timeLimit: 4,
          loadTime: 1,
          runTime: 2,
          time: 3,
          passed: true
        }
      ]
    })
  ).toMatchSnapshot()
})

it('renders list of success checks in silent mode', () => {
  expect(
    results(
      ['webpack', 'time'],
      {
        checks: [
          {
            name: 'limitless',
            size: 10,
            config: 'a',
            loadTime: 0.1,
            runTime: 0.5,
            time: 0.6
          },
          {
            name: 'size',
            size: 102400,
            sizeLimit: 102400,
            loadTime: 1,
            runTime: 2,
            time: 3,
            passed: true
          }
        ]
      },
      false,
      true
    )
  ).toMatchSnapshot()
})

it('renders list of failed checks in silent mode', () => {
  expect(
    results(
      ['webpack', 'time'],
      {
        checks: [
          {
            name: 'small fail',
            size: 102401,
            sizeLimit: 102400,
            passed: false
          },
          {
            name: 'big fail',
            size: 102500,
            sizeLimit: 102400,
            passed: false
          }
        ]
      },
      false,
      true
    )
  ).toMatchSnapshot()
})

it('renders list of failed and success checks in silent mode', () => {
  expect(
    results(
      ['webpack', 'time'],
      {
        checks: [
          {
            name: 'small fail',
            size: 102401,
            sizeLimit: 102400,
            passed: false
          },
          {
            name: 'limitless',
            size: 10,
            config: 'a',
            loadTime: 0.1,
            runTime: 0.5,
            time: 0.6
          },
          {
            name: 'size',
            size: 102400,
            sizeLimit: 102400,
            loadTime: 1,
            runTime: 2,
            time: 3,
            passed: true
          },
          {
            name: 'big fail',
            size: 102500,
            sizeLimit: 102400,
            passed: false
          }
        ]
      },
      false,
      true
    )
  ).toMatchSnapshot()
})

it('renders failed results', () => {
  expect(
    results(['file'], {
      checks: [
        {
          name: 'ok',
          size: 102400,
          sizeLimit: 102400,
          passed: true
        },
        {
          name: 'small fail',
          size: 102401,
          sizeLimit: 102400,
          passed: false
        },
        {
          name: 'big fail',
          size: 102500,
          sizeLimit: 102400,
          passed: false
        }
      ],
      failed: true,
      configPath: 'package.json'
    })
  ).toMatchSnapshot()
})

it('only renders failed results with --hide-passed flag', () => {
  expect(
    results(['file'], {
      checks: [
        {
          name: 'ok',
          size: 102400,
          sizeLimit: 102400,
          passed: true
        },
        {
          name: 'small fail',
          size: 102401,
          sizeLimit: 102400,
          passed: false
        },
        {
          name: 'big fail',
          size: 102500,
          sizeLimit: 102400,
          passed: false
        }
      ],
      hidePassed: true,
      failed: true,
      configPath: 'package.json'
    })
  ).toMatchSnapshot()
})

it('highlight passed results with --highlight-less flag', () => {
  expect(
    results(['file'], {
      checks: [
        {
          name: 'ok',
          size: 102400,
          sizeLimit: 102400,
          passed: true
        },
        {
          name: 'good',
          size: 97280, // 5 KiB less
          sizeLimit: 102400,
          passed: true
        },
        {
          name: 'fail',
          size: 102401,
          sizeLimit: 102400,
          passed: false
        }
      ],
      highlightLess: true,
      failed: true,
      configPath: 'package.json'
    })
  ).toMatchSnapshot()
})

it('renders single result', () => {
  expect(
    results(['file'], {
      checks: [
        {
          name: 'big fail',
          size: 101,
          sizeLimit: 100,
          passed: false
        }
      ],
      failed: true,
      configPath: '.size-limit.json'
    })
  ).toMatchSnapshot()
})

it('renders config-less result', () => {
  expect(
    results(['time'], {
      checks: [
        {
          name: 'big fail',
          size: 1000,
          timeLimit: 0.5,
          loadTime: 0.2,
          runTime: 0.3,
          time: 0.5,
          passed: false
        }
      ],
      failed: true
    })
  ).toMatchSnapshot()
})

it('renders JSON results', () => {
  expect(
    results(
      ['file'],
      {
        checks: [
          {
            name: 'big fail',
            path: '/a'
          },
          {
            name: 'big fail',
            size: 1000,
            timeLimit: 10,
            loadTime: 0.2,
            runTime: 0.3,
            time: 0.5,
            passed: false,
            path: '/b'
          }
        ],
        failed: true
      },
      true
    )
  ).toMatchSnapshot()
})

it('renders result for file without gzip', () => {
  expect(
    results(['file'], {
      checks: [
        {
          name: 'without gzip',
          size: 100,
          sizeLimit: 99,
          passed: true,
          gzip: false
        }
      ],
      failed: false,
      configPath: '.size-limit.json'
    })
  ).toMatchSnapshot()
})

it('renders Webpack stats help message', () => {
  expect(
    results(['webpack'], {
      checks: [],
      saveBundle: 'test'
    })
  ).toMatchSnapshot()
})
