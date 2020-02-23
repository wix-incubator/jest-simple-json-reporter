import testWithTypedContext, { TestInterface } from 'ava'
import createFolderStrucutre from 'create-folder-structure'
import * as execa from 'execa'
import { ciEnv, jestSimpleJsonReporterPath } from './utils'
import { s3BeforeAfterEach } from './s3-mock-setup'
import { TestContext } from './types'
import { binBeforeAfterEach } from './utils'

const test = testWithTypedContext as TestInterface<TestContext>

s3BeforeAfterEach(test)

binBeforeAfterEach(test)

test('all tests pass on first run', async t => {
  const generateProject = () =>
    createFolderStrucutre({
      entryName: 'project1',
      content: {
        'package.json': {
          name: 'test-project',
          license: 'MIT',
          scripts: {
            test: `${t.context.bin.testRetryPath} --test-runner jest -- ${t.context.bin.jestPath}`,
          },
          jest: {
            reporters: ['default', jestSimpleJsonReporterPath],
          },
        },
        '__tests__/test1.spec.js': `
                          describe('1', () => {
                            test('1.1', async () => {
                                if (process.env['TEST_1_PASS'] === 'true') {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
        '__tests__/test2.spec.js': `
                          describe('2', () => {
                            test('1.1', async () => {
                                if (process.env['TEST_2_PASS'] === 'true') {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
      },
    })

  const project1 = await generateProject()

  const result1 = await execa.command('yarn test', {
    cwd: project1.entryPath,
    env: {
      srcMd5: '1',
      TEST_1_PASS: 'true',
      TEST_2_PASS: 'true',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'ignore',
  })
  t.deepEqual(result1.exitCode, 0)

  const project2 = await generateProject()
  const result2 = await execa.command('yarn test', {
    cwd: project2.entryPath,
    env: {
      srcMd5: '1',
      TEST_1_PASS: 'false',
      TEST_2_PASS: 'false',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'ignore',
  })
  t.deepEqual(result2.exitCode, 0)
})

test('one test fail in first run and then pass in second run', async t => {
  const generateProject = () =>
    createFolderStrucutre({
      entryName: 'project1',
      content: {
        'package.json': {
          name: 'test-project',
          license: 'MIT',
          scripts: {
            test: `${t.context.bin.testRetryPath} --test-runner jest -- ${t.context.bin.jestPath}`,
          },
          jest: {
            reporters: ['default', jestSimpleJsonReporterPath],
          },
        },
        '__tests__/test1.spec.js': `
                          describe('1', () => {
                            test('1.1', () => {
                                if (process.env['TEST_1_1_PASS'] === 'true') {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
      },
    })
  const project1 = await generateProject()

  const result1 = await execa.command('yarn test', {
    cwd: project1.entryPath,
    env: {
      srcMd5: '1',
      TEST_1_1_PASS: 'false',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'ignore',
    reject: false,
  })
  t.deepEqual(result1.exitCode, 1)

  const project2 = await generateProject()

  const result2 = await execa.command('yarn test', {
    cwd: project2.entryPath,
    env: {
      srcMd5: '1',
      TEST_1_1_PASS: 'true',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'ignore',
  })
  t.deepEqual(result2.exitCode, 0)

  const project3 = await generateProject()

  const result3 = await execa.command('yarn test', {
    cwd: project3.entryPath,
    env: {
      srcMd5: '1',
      TEST_1_1_PASS: 'false',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'ignore',
  })
  t.deepEqual(result3.exitCode, 0)
})

test('all tests pass on second run', async t => {
  const generateProject = () =>
    createFolderStrucutre({
      entryName: 'project1',
      content: {
        'package.json': {
          name: 'test-project',
          license: 'MIT',
          scripts: {
            test: `${t.context.bin.testRetryPath} --test-runner jest -- ${t.context.bin.jestPath}`,
          },
          jest: {
            reporters: ['default', jestSimpleJsonReporterPath],
          },
        },
        '__tests__/test1.spec.js': `
                          describe('1', () => {
                            test('1.1', async () => {
                                if (process.env['TEST_1_1_PASS'] === 'true') {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                              test('1.2 - "string with special characters" - / "', async () => {
                                if (process.env['TEST_1_2_PASS'] === 'true') {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
        '__tests__/test2.spec.js': `
                          describe('2', () => {
                            test('2.1', async () => {
                                if (process.env['TEST_2_1_PASS'] === 'true') {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                              test('2.2 - "string with special characters" - / "', async () => {
                                if (process.env['TEST_2_2_PASS'] === 'true') {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
        '__tests__/test3.spec.js': `
                          describe('3', () => {
                            test('3.1', async () => {
                                if (process.env['TEST_3_1_PASS'] === 'true') {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                              test('3.2 - "string with special characters" - / "', async () => {
                                if (process.env['TEST_3_2_PASS'] === 'true') {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
      },
    })
  const project1 = await generateProject()

  const result1 = await execa.command('yarn test', {
    cwd: project1.entryPath,
    env: {
      srcMd5: '1',
      TEST_1_1_PASS: 'true',
      TEST_1_2_PASS: 'false',
      TEST_2_1_PASS: 'true',
      TEST_2_2_PASS: 'false',
      TEST_3_1_PASS: 'true',
      TEST_3_2_PASS: 'false',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'ignore',
    reject: false,
  })
  t.deepEqual(result1.exitCode, 1)

  const project2 = await generateProject()

  const result2 = await execa.command('yarn test', {
    cwd: project2.entryPath,
    env: {
      srcMd5: '1',
      TEST_1_1_PASS: 'false',
      TEST_1_2_PASS: 'true',
      TEST_2_1_PASS: 'false',
      TEST_2_2_PASS: 'true',
      TEST_3_1_PASS: 'false',
      TEST_3_2_PASS: 'true',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'ignore',
  })
  t.deepEqual(result2.exitCode, 0)

  const project3 = await generateProject()

  const result3 = await execa.command('yarn test', {
    cwd: project3.entryPath,
    env: {
      srcMd5: '1',
      TEST_1_1_PASS: 'false',
      TEST_1_2_PASS: 'false',
      TEST_2_1_PASS: 'false',
      TEST_2_2_PASS: 'false',
      TEST_3_1_PASS: 'false',
      TEST_3_2_PASS: 'false',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'ignore',
  })
  t.deepEqual(result3.exitCode, 0)
})

test('try to run executable that is not found from the project-dir but it still work because we run everything with yarn or npm and they put jest in the PATH', async t => {
  const { entryPath } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: `${t.context.bin.testRetryPath} --test-runner jest -- jest`,
        },
        jest: {
          reporters: ['default', jestSimpleJsonReporterPath],
        },
      },
      '__tests__/test1.spec.js': `
                          describe('1', () => {
                            test('1.1', async () => {
                                if (process.env['TEST_1_PASS'] === 'true') {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
    },
  })

  const result1 = await execa.command('yarn run test', {
    cwd: entryPath,
    env: {
      srcMd5: '1',
      TEST_1_PASS: 'true',
      TEST_2_PASS: 'true',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'ignore',
    reject: false,
  })
  t.deepEqual(result1.exitCode, 0)

  const result2 = await execa.command('npm run test', {
    cwd: entryPath,
    env: {
      srcMd5: '1',
      TEST_1_PASS: 'true',
      TEST_2_PASS: 'true',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'ignore',
    reject: false,
  })
  t.deepEqual(result2.exitCode, 0)
})
