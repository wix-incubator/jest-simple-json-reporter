import deepSort from '@wix/deep-sort'
import testWithTypedContext, { TestInterface } from 'ava'
import createFolderStrucutre from 'create-folder-structure'
import execa from 'execa'
import fse from 'fs-extra'
import path from 'path'
import { JsonReporter } from '@wix/test-json-reporter-api'
import { promisify } from 'util'

const resolveBinPromise = promisify<string, string>(require('resolve-bin'))

export type TestContext = {
  cleanup: () => Promise<void>
  jestPath: string
}

const test = testWithTypedContext as TestInterface<TestContext>

test.before(async t => {
  t.timeout(100000)
  t.context.jestPath = await resolveBinPromise('jest')
})

test.afterEach(async t => {
  await t.context.cleanup()
})

const jestSimpleJsonReporterPath = require.resolve('jest-simple-json-reporter')

test('dont specify output-path and use the default - run reporter on project with tests that passes', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: t.context.jestPath,
        },
        jest: {
          reporters: ['default', [jestSimpleJsonReporterPath, {}]],
        },
      },
      '__tests__/test.spec.js': `
                  describe('1', () => {
                    test('test-passed1!', async () => {
                        expect(1).toEqual(1)
                      })
                    test('test-passed2!', async () => {
                        expect(2).toEqual(2)
                      })
                  })
                  `,
    },
  })
  t.context.cleanup = cleanup

  await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
  })

  const reporterOutput = await fse.readFile(path.join(entryPath, 'jest-simple-json-reporter-results.json'))
  t.true(reporterOutput.includes('test-passed1!'))
  t.true(reporterOutput.includes('test-passed2!'))

  const reporterOutputAsJson = await fse.readJSON(path.join(entryPath, 'jest-simple-json-reporter-results.json'))
  t.true(reporterOutputAsJson.passed)
})

test('dont specify output-path and use the default - run reporter on project with tests that fails', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: t.context.jestPath,
        },
        jest: {
          reporters: ['default', [jestSimpleJsonReporterPath, {}]],
        },
      },
      '.npmrc': 'registry=https://registry.npmjs.org/',
      'test.spec.js': `
                  describe('1', () => {
                    test('test-passed!', async () => {
                        expect(1).toEqual(1)
                      })
                    test('test-failed!', async () => {
                        expect(1).toEqual(2)
                      })
                  })
                  `,
    },
  })
  t.context.cleanup = cleanup

  await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    reject: false,
  })

  const reporterOutput = await fse.readFile(path.join(entryPath, 'jest-simple-json-reporter-results.json'))
  t.true(reporterOutput.includes('test-passed!'))
  t.true(reporterOutput.includes('test-failed!'))

  const reporterOutputAsJson = await fse.readJSON(path.join(entryPath, 'jest-simple-json-reporter-results.json'))
  t.false(reporterOutputAsJson.passed)
})

test('dont specify output-path and use the default - specify reporter without array', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: t.context.jestPath,
        },
        jest: {
          reporters: [[jestSimpleJsonReporterPath, {}]],
        },
      },
      '.npmrc': 'registry=https://registry.npmjs.org/',
      'test.spec.js': `
                  describe('1', () => {
                    test('test-passed1!', async () => {
                        expect(1).toEqual(1)
                      })
                    test('test-passes2!', async () => {
                        expect(2).toEqual(2)
                      })
                  })
                  `,
    },
  })
  t.context.cleanup = cleanup

  await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
  })

  const reporterOutput = await fse.readFile(path.join(entryPath, 'jest-simple-json-reporter-results.json'))
  t.true(reporterOutput.includes('test-passed1!'))
  t.true(reporterOutput.includes('test-passes2!'))

  const reporterOutputAsJson = await fse.readJSON(path.join(entryPath, 'jest-simple-json-reporter-results.json'))
  t.true(reporterOutputAsJson.passed)
})

test('sepcify output-path - specify reporter without array - tests pass', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: t.context.jestPath,
        },
        jest: {
          reporters: ['default', [jestSimpleJsonReporterPath, { outputPath: './custom-path.json' }]],
        },
      },
      '.npmrc': 'registry=https://registry.npmjs.org/',
      'test.spec.js': `
                  describe('1', () => {
                    test('test-passed1!', async () => {
                        expect(1).toEqual(1)
                      })
                    test('test-passes2!', async () => {
                        expect(2).toEqual(2)
                      })
                  })
                  `,
    },
  })
  t.context.cleanup = cleanup

  await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    reject: false,
  })

  const reporterOutput = await fse.readFile(path.join(entryPath, 'custom-path.json'))
  t.true(reporterOutput.includes('test-passed1!'))
  t.true(reporterOutput.includes('test-passes2!'))

  const reporterOutputAsJson = await fse.readJSON(path.join(entryPath, 'custom-path.json'))
  t.true(reporterOutputAsJson.passed)
})

test('sepcify output-path - specify reporter without array - tests fail', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: t.context.jestPath,
        },
        jest: {
          reporters: [[jestSimpleJsonReporterPath, { outputPath: './custom-path.json' }]],
        },
      },
      '.npmrc': 'registry=https://registry.npmjs.org/',
      'test.spec.js': `
                  describe('1', () => {
                    test('test-passed!', async () => {
                        expect(1).toEqual(1)
                      })
                    test('test-failed!', async () => {
                        expect(1).toEqual(2)
                      })
                  })
                  `,
    },
  })
  t.context.cleanup = cleanup

  await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    reject: false,
  })

  const reporterOutput = await fse.readFile(path.join(entryPath, 'custom-path.json'))
  t.true(reporterOutput.includes('test-passed!'))
  t.true(reporterOutput.includes('test-failed!'))

  const reporterOutputAsJson = await fse.readJSON(path.join(entryPath, 'custom-path.json'))
  t.false(reporterOutputAsJson.passed)
})

test('sepcify output-path - specify output-path with env-var - tests fail', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: t.context.jestPath,
        },
        jest: {
          reporters: ['default', jestSimpleJsonReporterPath],
        },
      },
      '.npmrc': 'registry=https://registry.npmjs.org/',
      'test.spec.js': `
                  describe('1', () => {
                    test('test-passed!', async () => {
                        expect(1).toEqual(1)
                      })
                    test('test-failed!', async () => {
                        expect(1).toEqual(2)
                      })
                  })
                  `,
    },
  })
  t.context.cleanup = cleanup

  await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    reject: false,
    env: {
      TEST_JSON_REPORTER_OUTPUT_PATH: './custom-path1.json',
    },
  })

  const reporterOutput = await fse.readFile(path.join(entryPath, 'custom-path1.json'))
  t.true(reporterOutput.includes('test-passed!'))
  t.true(reporterOutput.includes('test-failed!'))

  const reporterOutputAsJson = await fse.readJSON(path.join(entryPath, 'custom-path1.json'))
  t.false(reporterOutputAsJson.passed)
})

test('assert summary structure - tests pass', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: `${t.context.jestPath} --runInBand`,
        },
        jest: {
          reporters: ['default', [jestSimpleJsonReporterPath, { useAbsolutePaths: false }]],
        },
      },
      '.npmrc': 'registry=https://registry.npmjs.org/',
      '__tests__/test1.spec.js': `
                  describe('1', () => {
                    test('test-passed1!', async () => {
                        expect(1).toEqual(1)
                      })
                    test('test-passed2!', async () => {
                        expect(2).toEqual(2)
                      })
                  })
                  `,
      '__tests__/test2.spec.js': `
                  describe('2', () => {
                    test('test-passed1!', async () => {
                        expect(1).toEqual(1)
                      })
                    test('test-passed2!', async () => {
                        expect(2).toEqual(2)
                      })
                  })
                  `,
    },
  })
  t.context.cleanup = cleanup

  await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
  })

  const expectedReport: JsonReporter = await fse.readJSON(
    path.join(entryPath, 'jest-simple-json-reporter-results.json'),
  )
  t.deepEqual(
    deepSort(expectedReport),
    deepSort({
      passed: true,
      filesResult: [
        {
          passed: true,
          path: `./${path.join('__tests__', 'test1.spec.js')}`,
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '1 test-passed1!',
            },
            {
              didRun: true,
              passed: true,
              fullName: '1 test-passed2!',
            },
          ],
        },
        {
          passed: true,
          path: `./${path.join('__tests__', 'test2.spec.js')}`,
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '2 test-passed1!',
            },
            {
              didRun: true,
              passed: true,
              fullName: '2 test-passed2!',
            },
          ],
        },
      ],
    }),
  )
})

test('assert summary structure - some tests fail', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: `${t.context.jestPath} --runInBand`,
        },
        jest: {
          reporters: ['default', [jestSimpleJsonReporterPath, {}]],
        },
      },
      '.npmrc': 'registry=https://registry.npmjs.org/',
      '__tests__/test1.spec.js': `
                  describe('1', () => {
                    test('test-passed1!', async () => {
                        expect(1).toEqual(1)
                      })
                    test.skip('test-passed2!', async () => {
                        expect(2).toEqual(2)
                      })
                  })
                  `,
      '__tests__/test2.spec.js': `
                  describe('2', () => {
                    test('test-passed!', async () => {
                        expect(1).toEqual(1)
                      })
                    test('test-failed!', async () => {
                        expect(1).toEqual(2)
                      })
                  })
                  `,
    },
  })
  t.context.cleanup = cleanup

  await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    reject: false,
  })

  const expectedReport: JsonReporter = await fse.readJSON(
    path.join(entryPath, 'jest-simple-json-reporter-results.json'),
  )
  t.deepEqual(
    deepSort(expectedReport),
    deepSort({
      passed: false,
      filesResult: [
        {
          passed: true,
          path: `./${path.join('__tests__', 'test1.spec.js')}`,
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '1 test-passed1!',
            },
            {
              didRun: false,
              passed: false,
              fullName: '1 test-passed2!',
            },
          ],
        },
        {
          passed: false,
          path: `./${path.join('__tests__', 'test2.spec.js')}`,
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '2 test-passed!',
            },
            {
              didRun: true,
              passed: false,
              fullName: '2 test-failed!',
            },
          ],
        },
      ],
    }),
  )
})

test('assert summary structure - no tests in each file', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: `${t.context.jestPath} --runInBand`,
        },
        jest: {
          reporters: ['default', [jestSimpleJsonReporterPath, { useAbsolutePaths: true }]],
        },
      },
      '.npmrc': 'registry=https://registry.npmjs.org/',
      '__tests__/test1.spec.js': `
                  `,
      '__tests__/test2.spec.js': `
                  `,
    },
  })
  t.context.cleanup = cleanup

  await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    reject: false,
  })

  const expectedReport: JsonReporter = await fse.readJSON(
    path.join(entryPath, 'jest-simple-json-reporter-results.json'),
  )
  t.deepEqual(
    deepSort(expectedReport),
    deepSort({
      passed: true,
      filesResult: [
        {
          passed: true,
          path: path.join(entryPath, '__tests__', 'test1.spec.js'),
          testResults: [],
        },
        {
          passed: true,
          path: path.join(entryPath, '__tests__', 'test2.spec.js'),
          testResults: [],
        },
      ],
    }),
  )
})

test('assert summary structure - no tests in each file - KEEP_PATH_AS_IS=true', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: `${t.context.jestPath} --runInBand`,
        },
        jest: {
          reporters: ['default', jestSimpleJsonReporterPath],
        },
      },
      '.npmrc': 'registry=https://registry.npmjs.org/',
      '__tests__/test1.spec.js': `
                  `,
      '__tests__/test2.spec.js': `
                  `,
    },
  })
  t.context.cleanup = cleanup

  await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    reject: false,
    env: {
      KEEP_PATH_AS_IS: 'true',
    },
  })

  const expectedReport: JsonReporter = await fse.readJSON(
    path.join(entryPath, 'jest-simple-json-reporter-results.json'),
  )
  t.deepEqual(
    deepSort(expectedReport),
    deepSort({
      passed: true,
      filesResult: [
        {
          passed: true,
          path: path.join(entryPath, '__tests__', 'test1.spec.js'),
          testResults: [],
        },
        {
          passed: true,
          path: path.join(entryPath, '__tests__', 'test2.spec.js'),
          testResults: [],
        },
      ],
    }),
  )
})

test('assert summary structure - 2 files - only run one of them', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: `${t.context.jestPath} --runInBand -t "1 test-passed!"`,
        },
        jest: {
          reporters: ['default', jestSimpleJsonReporterPath],
        },
      },
      '.npmrc': 'registry=https://registry.npmjs.org/',
      '__tests__/test1.spec.js': `
        describe('1', () => {
          test('test-passed!', async () => {
              expect(1).toEqual(1)
            })
        })
                    `,
      '__tests__/test2.spec.js': `
        describe('2', () => {
          test('test-failed!', async () => {
              expect(2).toEqual(1)
            })
        })
                    `,
    },
  })
  t.context.cleanup = cleanup

  await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    reject: false,
  })

  const expectedReport: JsonReporter = await fse.readJSON(
    path.join(entryPath, 'jest-simple-json-reporter-results.json'),
  )
  t.deepEqual(
    deepSort(expectedReport),
    deepSort({
      passed: true,
      filesResult: [
        {
          passed: true,
          path: `./${path.join('__tests__', 'test1.spec.js')}`,
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '1 test-passed!',
            },
          ],
        },
        {
          passed: true,
          path: `./${path.join('.', '__tests__', 'test2.spec.js')}`,
          testResults: [
            {
              didRun: false,
              passed: false,
              fullName: '2 test-failed!',
            },
          ],
        },
      ],
    }),
  )
})

test('assert summary structure - all tests are skipped', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: `${t.context.jestPath} --runInBand`,
        },
        jest: {
          reporters: ['default', [jestSimpleJsonReporterPath, {}]],
        },
      },
      '.npmrc': 'registry=https://registry.npmjs.org/',
      '__tests__/test1.spec.js': `
                  describe('1', () => {
                    test.skip('test-passed1!', async () => {
                        expect(1).toEqual(1)
                      })
                    test.skip('test-passed2!', async () => {
                        expect(2).toEqual(2)
                      })
                  })
                  `,
      '__tests__/test2.spec.js': `
                  describe('2', () => {
                    test.skip('test-passed!', async () => {
                        expect(1).toEqual(1)
                      })
                    test.skip('test-failed!', async () => {
                        expect(1).toEqual(2)
                      })
                  })
                  `,
    },
  })
  t.context.cleanup = cleanup

  await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    reject: false,
  })

  const expectedReport: JsonReporter = await fse.readJSON(
    path.join(entryPath, 'jest-simple-json-reporter-results.json'),
  )
  t.deepEqual(
    deepSort(expectedReport),
    deepSort({
      passed: true,
      filesResult: [
        {
          passed: true,
          path: `./${path.join('__tests__', 'test1.spec.js')}`,
          testResults: [
            {
              didRun: false,
              passed: false,
              fullName: '1 test-passed1!',
            },
            {
              didRun: false,
              passed: false,
              fullName: '1 test-passed2!',
            },
          ],
        },
        {
          passed: true,
          path: `./${path.join('__tests__', 'test2.spec.js')}`,
          testResults: [
            {
              didRun: false,
              passed: false,
              fullName: '2 test-passed!',
            },
            {
              didRun: false,
              passed: false,
              fullName: '2 test-failed!',
            },
          ],
        },
      ],
    }),
  )
})

test('assert summary structure - file is skipped', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: `${t.context.jestPath} --runInBand`,
        },
        jest: {
          reporters: ['default', [jestSimpleJsonReporterPath, {}]],
        },
      },
      '.npmrc': 'registry=https://registry.npmjs.org/',
      '__tests__/test1.spec.js': `
                  describe('1', () => {
                    test('test-passed1!', async () => {
                        expect(1).toEqual(1)
                      })
                    test('test-passed2!', async () => {
                        expect(2).toEqual(2)
                      })
                  })
                  `,
      '__tests__/test2.spec.js': `
                  describe('2', () => {
                    test.skip('test-passed!', async () => {
                        expect(1).toEqual(1)
                      })
                    test.skip('test-failed!', async () => {
                        expect(1).toEqual(2)
                      })
                  })
                  `,
    },
  })
  t.context.cleanup = cleanup

  await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    reject: false,
  })

  const expectedReport: JsonReporter = await fse.readJSON(
    path.join(entryPath, 'jest-simple-json-reporter-results.json'),
  )
  t.deepEqual(
    deepSort(expectedReport),
    deepSort({
      passed: true,
      filesResult: [
        {
          passed: true,
          path: `./${path.join('__tests__', 'test1.spec.js')}`,
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '1 test-passed1!',
            },
            {
              didRun: true,
              passed: true,
              fullName: '1 test-passed2!',
            },
          ],
        },
        {
          passed: true,
          path: `./${path.join('__tests__', 'test2.spec.js')}`,
          testResults: [
            {
              didRun: false,
              passed: false,
              fullName: '2 test-passed!',
            },
            {
              didRun: false,
              passed: false,
              fullName: '2 test-failed!',
            },
          ],
        },
      ],
    }),
  )
})
