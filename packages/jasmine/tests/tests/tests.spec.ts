import testWithTypedContext, { TestInterface } from 'ava'
import * as execa from 'execa'
import * as fse from 'fs-extra'
import * as path from 'path'
import { promisify } from 'util'
import { generateProject, jasmineModulePath, jasmineReporterModulePath, jasmineSimpleJsonReporterPath } from './utils'
import { JsonReporter } from '@wix/test-json-reporter-api'
import deepSort from '@wix/deep-sort'

const resolveBinPromise = promisify<string, string>(require('resolve-bin'))

export type TestContext = {
  cleanup: () => Promise<void>
  jasminePath: string
}

const test = testWithTypedContext as TestInterface<TestContext>

test.before(async t => {
  t.timeout(100000)
  t.context.jasminePath = await resolveBinPromise('jasmine')
})

test.afterEach(async t => {
  await t.context.cleanup()
})

test('project with single test that passes', async t => {
  const { entryPath, cleanup } = await generateProject({
    'jasmine.js': `
    const Jasmine = require('${jasmineModulePath}');
    const jasmine = new Jasmine();
    jasmine.loadConfig({
      spec_dir: 'spec',
      spec_files: ['**/*.spec.js'],
    });
    const JasmineConsoleReporter = require("${jasmineReporterModulePath}");
    jasmine.addReporter(new JasmineConsoleReporter());
    jasmine.addReporter(require("${jasmineSimpleJsonReporterPath}")());
    jasmine.execute();
  `,
    'spec/test1.spec.js': `
                  describe('1', () => {
                    it('1.1', () => {
                      console.log("stav1")
                        expect(1).toBe(1)
                      })
                  })
                  `,
  })
  t.context.cleanup = cleanup

  const result1 = await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    stdio: 'ignore',
  })

  t.deepEqual(result1.exitCode, 0)

  const report: JsonReporter = await fse.readJSON(path.join(entryPath, 'jasmine-simple-json-reporter-results.json'))
  t.deepEqual(
    deepSort(report),
    deepSort({
      passed: true,
      filesResult: [
        {
          passed: true,
          path: 'not specified',
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '1 1.1',
            },
          ],
        },
      ],
    }),
  )
})

test('options - custom output by env-var', async t => {
  const { entryPath, cleanup } = await generateProject({
    'jasmine.js': `
    const Jasmine = require('${jasmineModulePath}');
    const jasmine = new Jasmine();
    jasmine.loadConfig({
      spec_dir: 'spec',
      spec_files: ['**/*.spec.js'],
    });
    const JasmineConsoleReporter = require("${jasmineReporterModulePath}");
    jasmine.addReporter(new JasmineConsoleReporter());
    jasmine.addReporter(require("${jasmineSimpleJsonReporterPath}")());
    jasmine.execute();
  `,
    'spec/test1.spec.js': `
                  describe('1', () => {
                    it('1.1', () => {
                      console.log("stav1")
                        expect(1).toBe(1)
                      })
                  })
                  `,
  })
  t.context.cleanup = cleanup

  const result1 = await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    stdio: 'ignore',
    env: {
      TEST_JSON_REPORTER_OUTPUT_PATH: './output.json',
    },
  })

  t.deepEqual(result1.exitCode, 0)

  const report: JsonReporter = await fse.readJSON(path.join(entryPath, 'output.json'))
  t.deepEqual(
    deepSort(report),
    deepSort({
      passed: true,
      filesResult: [
        {
          passed: true,
          path: 'not specified',
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '1 1.1',
            },
          ],
        },
      ],
    }),
  )
})

test('options - custom output by options.outputPath', async t => {
  const { entryPath, cleanup } = await generateProject({
    'jasmine.js': `
    const Jasmine = require('${jasmineModulePath}');
    const jasmine = new Jasmine();
    jasmine.loadConfig({
      spec_dir: 'spec',
      spec_files: ['**/*.spec.js'],
    });
    const JasmineConsoleReporter = require("${jasmineReporterModulePath}");
    jasmine.addReporter(new JasmineConsoleReporter());
    jasmine.addReporter(require("${jasmineSimpleJsonReporterPath}")({outputPath:"./output.json"}));
    jasmine.execute();
  `,
    'spec/test1.spec.js': `
                  describe('1', () => {
                    it('1.1', () => {
                      console.log("stav1")
                        expect(1).toBe(1)
                      })
                  })
                  `,
  })
  t.context.cleanup = cleanup

  const result1 = await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    stdio: 'ignore',
  })

  t.deepEqual(result1.exitCode, 0)

  const report: JsonReporter = await fse.readJSON(path.join(entryPath, 'output.json'))
  t.deepEqual(
    deepSort(report),
    deepSort({
      passed: true,
      filesResult: [
        {
          passed: true,
          path: 'not specified',
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '1 1.1',
            },
          ],
        },
      ],
    }),
  )
})

test('project with single test that is skipped', async t => {
  const { entryPath, cleanup } = await generateProject({
    'jasmine.js': `
    const Jasmine = require('${jasmineModulePath}');
    const jasmine = new Jasmine();
    jasmine.loadConfig({
      spec_dir: 'spec',
      spec_files: ['**/*.spec.js'],
    });
    const JasmineConsoleReporter = require("${jasmineReporterModulePath}");
    jasmine.addReporter(new JasmineConsoleReporter());
    jasmine.addReporter(require("${jasmineSimpleJsonReporterPath}")());
    jasmine.execute();
  `,
    'spec/test1.spec.js': `
                  xdescribe('1', () => {
                    it('1.1', () => {
                      console.log("stav1")
                        expect(1).toBe(1)
                      })
                  })
                  `,
  })
  t.context.cleanup = cleanup

  const result1 = await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    stdio: 'ignore',
  })

  t.deepEqual(result1.exitCode, 0)

  const report: JsonReporter = await fse.readJSON(path.join(entryPath, 'jasmine-simple-json-reporter-results.json'))

  t.deepEqual(
    deepSort(report),
    deepSort({
      passed: true,
      filesResult: [
        {
          passed: false,
          path: 'not specified',
          testResults: [
            {
              didRun: false,
              passed: false,
              fullName: '1 1.1',
            },
          ],
        },
      ],
    }),
  )
})

test('project with multiple test files with multiple tests that all pass', async t => {
  const { entryPath, cleanup } = await generateProject({
    'jasmine.js': `
    const Jasmine = require('${jasmineModulePath}');
    const jasmine = new Jasmine();
    jasmine.loadConfig({
      spec_dir: 'spec',
      spec_files: ['**/*.spec.js'],
    });
    const JasmineConsoleReporter = require("${jasmineReporterModulePath}");
    jasmine.addReporter(new JasmineConsoleReporter());
    jasmine.addReporter(require("${jasmineSimpleJsonReporterPath}")());
    jasmine.execute();
  `,
    'spec/test1.spec.js': `
  describe('1', () => {
    it('1.1', () => {
      console.log("stav1")
        expect(1).toBe(1)
      })
      it('1.2', () => {
        console.log("stav1")
          expect(1).toBe(1)
        })
  })
                `,
    'spec/test2.spec.js': `
                describe('2', () => {
                  it('2.1', () => {
                    console.log("stav1")
                      expect(1).toBe(1)
                    })
                    it('2.2', () => {
                      console.log("stav1")
                        expect(1).toBe(1)
                      })
                })
                              `,
  })
  t.context.cleanup = cleanup

  const result1 = await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    stdio: 'ignore',
  })

  t.deepEqual(result1.exitCode, 0)

  const report: JsonReporter = await fse.readJSON(path.join(entryPath, 'jasmine-simple-json-reporter-results.json'))
  t.deepEqual(
    deepSort(report),
    deepSort({
      passed: true,
      filesResult: [
        {
          passed: true,
          path: 'not specified',
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '1 1.1',
            },
          ],
        },
        {
          passed: true,
          path: 'not specified',
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '1 1.2',
            },
          ],
        },
        {
          passed: true,
          path: 'not specified',
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '2 2.2',
            },
          ],
        },
        {
          passed: true,
          path: 'not specified',
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '2 2.1',
            },
          ],
        },
      ],
    }),
  )
})

test('project with multiple test files with multiple tests that some fail', async t => {
  const { entryPath, cleanup } = await generateProject({
    'jasmine.js': `
    const Jasmine = require('${jasmineModulePath}');
    const jasmine = new Jasmine();
    jasmine.loadConfig({
      spec_dir: 'spec',
      spec_files: ['**/*.spec.js'],
    });
    const JasmineConsoleReporter = require("${jasmineReporterModulePath}");
    jasmine.addReporter(new JasmineConsoleReporter());
    jasmine.addReporter(require("${jasmineSimpleJsonReporterPath}")());
    jasmine.execute();
  `,
    'spec/test1.spec.js': `
  describe('1', () => {
    it('1.1', () => {
      console.log("stav1")
        expect(1).toBe(1)
      })
      it('1.2', () => {
        console.log("stav1")
          expect(1).toBe(1)
        })
  })
                `,
    'spec/test2.spec.js': `
                describe('2', () => {
                  it('2.1', () => {
                    console.log("stav1")
                      expect(1).toBe(2)
                    })
                    it('2.2', () => {
                      console.log("stav1")
                        expect(1).toBe(1)
                      })
                })
                              `,
  })
  t.context.cleanup = cleanup

  const result1 = await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    stdio: 'ignore',
    reject: false,
  })

  t.deepEqual(result1.exitCode, 1)

  const report: JsonReporter = await fse.readJSON(path.join(entryPath, 'jasmine-simple-json-reporter-results.json'))
  t.deepEqual(
    deepSort(report),
    deepSort({
      passed: false,
      filesResult: [
        {
          passed: true,
          path: 'not specified',
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '1 1.1',
            },
          ],
        },
        {
          passed: true,
          path: 'not specified',
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '1 1.2',
            },
          ],
        },
        {
          passed: true,
          path: 'not specified',
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '2 2.2',
            },
          ],
        },
        {
          passed: false,
          path: 'not specified',
          testResults: [
            {
              didRun: true,
              passed: false,
              fullName: '2 2.1',
            },
          ],
        },
      ],
    }),
  )
})

test('project with multiple test files with multiple tests that some fail and some skipped', async t => {
  const { entryPath, cleanup } = await generateProject({
    'jasmine.js': `
    const Jasmine = require('${jasmineModulePath}');
    const jasmine = new Jasmine();
    jasmine.loadConfig({
      spec_dir: 'spec',
      spec_files: ['**/*.spec.js'],
    });
    const JasmineConsoleReporter = require("${jasmineReporterModulePath}");
    jasmine.addReporter(new JasmineConsoleReporter());
    jasmine.addReporter(require("${jasmineSimpleJsonReporterPath}")());
    jasmine.execute();
  `,
    'spec/test1.spec.js': `
  describe('1', () => {
    it('1.1', () => {
      console.log("stav1")
        expect(1).toBe(1)
      })
      xit('1.2', () => {
        console.log("stav1")
          expect(1).toBe(1)
        })
  })
                `,
    'spec/test2.spec.js': `
                describe('2', () => {
                  it('2.1', () => {
                    console.log("stav1")
                      expect(1).toBe(2)
                    })
                    it('2.2', () => {
                      console.log("stav1")
                        expect(1).toBe(1)
                      })
                })
                              `,
  })
  t.context.cleanup = cleanup

  const result1 = await execa('yarn', 'test'.split(' '), {
    cwd: entryPath,
    stdio: 'ignore',
    reject: false,
  })

  t.deepEqual(result1.exitCode, 1)

  const report: JsonReporter = await fse.readJSON(path.join(entryPath, 'jasmine-simple-json-reporter-results.json'))
  t.deepEqual(
    deepSort(report),
    deepSort({
      passed: false,
      filesResult: [
        {
          passed: true,
          path: 'not specified',
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '1 1.1',
            },
          ],
        },
        {
          passed: false,
          path: 'not specified',
          testResults: [
            {
              didRun: false,
              passed: false,
              fullName: '1 1.2',
            },
          ],
        },
        {
          passed: true,
          path: 'not specified',
          testResults: [
            {
              didRun: true,
              passed: true,
              fullName: '2 2.2',
            },
          ],
        },
        {
          passed: false,
          path: 'not specified',
          testResults: [
            {
              didRun: true,
              passed: false,
              fullName: '2 2.1',
            },
          ],
        },
      ],
    }),
  )
})
