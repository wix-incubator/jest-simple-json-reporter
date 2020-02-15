import testWithTypedContext, { TestInterface } from 'ava'
import createFolderStrucutre from 'create-folder-structure'
import * as execa from 'execa'
import * as fse from 'fs-extra'
import * as path from 'path'

export type TestContext = {
  cleanup: () => Promise<void>
}

const test = testWithTypedContext as TestInterface<TestContext>

test.before(t => {
  t.timeout(100000)
})

test.afterEach(async t => {
  await t.context.cleanup()
})

const jestPath = path.join(__dirname, '..', '..', '..', 'node_modules', '.bin', 'jest') // to avoid installing jest in every project. takes too much time
const jestSimpleJsonReporterPath = require.resolve('jest-simple-json-reporter')

test('dont specify output-path and use the default - run reporter on project with tests that passes', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: jestPath,
        },
        jest: {
          reporters: ['default',[jestSimpleJsonReporterPath, {}]],
        },
      },
      '.npmrc': 'registry=https://registry.npmjs.org/',
      '__tests__test.spec.js': `
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
  t.deepEqual(reporterOutputAsJson.numPassedTests, 2)
})

test('dont specify output-path and use the default - run reporter on project with tests that fails', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: jestPath,
        },
        jest: {
          reporters: ['default',[jestSimpleJsonReporterPath, {}]],
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
  t.deepEqual(reporterOutputAsJson.numPassedTests, 1)
})

test('dont specify output-path and use the default - specify reporter without array', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: jestPath,
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
  t.deepEqual(reporterOutputAsJson.numPassedTests, 2)
})

test('sepcify output-path - specify reporter without array - tests pass', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: jestPath,
        },
        jest: {
          reporters: ['default',[jestSimpleJsonReporterPath, { outputPath: './custom-path.json' }]],
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
  t.deepEqual(reporterOutputAsJson.numPassedTests, 2)
})

test('sepcify output-path - specify reporter without array - tests fail', async t => {
  const { entryPath, cleanup } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: jestPath,
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
  t.deepEqual(reporterOutputAsJson.numPassedTests, 1)
})
