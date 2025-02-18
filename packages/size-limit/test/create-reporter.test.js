import { expect, it } from 'vitest'

import createReporter from '../create-reporter'

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
          config: 'a',
          loadTime: 0.1,
          name: 'limitless',
          runTime: 0.5,
          size: 10,
          totalTime: 0.6
        },
        {
          loadTime: 1,
          name: 'size',
          passed: true,
          runTime: 2,
          size: 102400,
          sizeLimit: 102400,
          totalTime: 3
        },
        {
          gzip: false,
          loadTime: 1,
          name: 'time',
          passed: true,
          runTime: 2,
          size: 102400,
          timeLimit: 4,
          totalTime: 3
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
            config: 'a',
            loadTime: 0.1,
            name: 'limitless',
            runTime: 0.5,
            size: 10,
            totalTime: 0.6
          },
          {
            loadTime: 1,
            name: 'size',
            passed: true,
            runTime: 2,
            size: 102400,
            sizeLimit: 102400,
            totalTime: 3
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
            passed: false,
            size: 102401,
            sizeLimit: 102400
          },
          {
            name: 'big fail',
            passed: false,
            size: 102500,
            sizeLimit: 102400
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
            passed: false,
            size: 102401,
            sizeLimit: 102400
          },
          {
            config: 'a',
            loadTime: 0.1,
            name: 'limitless',
            runTime: 0.5,
            size: 10,
            totalTime: 0.6
          },
          {
            loadTime: 1,
            name: 'size',
            passed: true,
            runTime: 2,
            size: 102400,
            sizeLimit: 102400,
            totalTime: 3
          },
          {
            name: 'big fail',
            passed: false,
            size: 102500,
            sizeLimit: 102400
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
          passed: true,
          size: 102400,
          sizeLimit: 102400
        },
        {
          name: 'small fail',
          passed: false,
          size: 102401,
          sizeLimit: 102400
        },
        {
          name: 'big fail',
          passed: false,
          size: 102500,
          sizeLimit: 102400
        }
      ],
      configPath: 'package.json',
      failed: true
    })
  ).toMatchSnapshot()
})

it('only renders failed results with --hide-passed flag', () => {
  expect(
    results(['file'], {
      checks: [
        {
          name: 'ok',
          passed: true,
          size: 102400,
          sizeLimit: 102400
        },
        {
          name: 'small fail',
          passed: false,
          size: 102401,
          sizeLimit: 102400
        },
        {
          name: 'big fail',
          passed: false,
          size: 102500,
          sizeLimit: 102400
        }
      ],
      configPath: 'package.json',
      failed: true,
      hidePassed: true
    })
  ).toMatchSnapshot()
})

it('highlight passed results with --highlight-less flag', () => {
  expect(
    results(['file'], {
      checks: [
        {
          name: 'ok',
          passed: true,
          size: 102400,
          sizeLimit: 102400
        },
        {
          name: 'good',
          passed: true,
          size: 97280, // 5 KiB less
          sizeLimit: 102400
        },
        {
          name: 'fail',
          passed: false,
          size: 102401,
          sizeLimit: 102400
        }
      ],
      configPath: 'package.json',
      failed: true,
      highlightLess: true
    })
  ).toMatchSnapshot()
})

it('renders single result', () => {
  expect(
    results(['file'], {
      checks: [
        {
          name: 'big fail',
          passed: false,
          size: 101,
          sizeLimit: 100
        }
      ],
      configPath: '.size-limit.json',
      failed: true
    })
  ).toMatchSnapshot()
})

it('renders custom message', () => {
  expect(
    results(['file'], {
      checks: [
        {
          message: 'see docs for additional instructions',
          name: 'big fail',
          passed: false,
          size: 101,
          sizeLimit: 100
        }
      ],
      configPath: '.size-limit.json',
      failed: true
    })
  ).toMatchSnapshot()
})

it('renders config-less result', () => {
  expect(
    results(['time'], {
      checks: [
        {
          loadTime: 0.2,
          name: 'big fail',
          passed: false,
          runTime: 0.3,
          size: 1000,
          timeLimit: 0.5,
          totalTime: 0.5
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
            loadTime: 0.2,
            name: 'big fail',
            passed: false,
            path: '/b',
            runTime: 0.3,
            size: 1000,
            timeLimit: 10,
            totalTime: 0.5
          }
        ],
        failed: true
      },
      true
    )
  ).toMatchSnapshot()
})

it('renders result for file without compression', () => {
  expect(
    results(['file'], {
      checks: [
        {
          brotli: false,
          name: 'without compression',
          passed: true,
          size: 100,
          sizeLimit: 99
        }
      ],
      configPath: '.size-limit.json',
      failed: false
    })
  ).toMatchSnapshot()
})

it('renders result for file with gzip', () => {
  expect(
    results(['file'], {
      checks: [
        {
          gzip: true,
          name: 'with gzip',
          passed: true,
          size: 100,
          sizeLimit: 99
        }
      ],
      configPath: '.size-limit.json',
      failed: false
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

it('renders loading time with custom message from time options for every check', () => {
  expect(
    results(['time'], {
      checks: [
        {
          loadTime: 0.2,
          name: 'loading message 1',
          passed: true,
          runTime: 0.4,
          size: 10,
          time: { loadingMessage: 'for ~1000 users per month' },
          totalTime: 1.4
        },
        {
          loadTime: 0.2,
          name: 'loading message 2',
          passed: true,
          runTime: 0.3,
          time: { loadingMessage: '' }
        }
      ]
    })
  ).toMatchSnapshot()
})
