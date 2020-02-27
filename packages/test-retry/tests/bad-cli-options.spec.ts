import testWithTypedContext, { TestInterface } from 'ava'
import createFolderStrucutre from 'create-folder-structure'
import * as execa from 'execa'
import { ciEnv, jestSimpleJsonReporterPath, binBeforeAfterEach } from './utils'
import { TestContext } from './types'
import { s3BeforeAfterEach } from './s3-mock-setup'

const test = testWithTypedContext as TestInterface<TestContext>

s3BeforeAfterEach(test)

binBeforeAfterEach(test)

test('missing command to run at the end', async t => {
  const { entryPath } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: `${t.context.bin.testRetryPath} --test-runner jest`,
        },
        jest: {
          reporters: ['default', jestSimpleJsonReporterPath],
        },
      },
      '__tests__/test1.spec.js': `
                          describe('1', () => {
                            test('test-passed1!', async () => {
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

  const result1 = await execa.command('yarn test', {
    cwd: entryPath,
    env: {
      SRC_MD5: '1',
      TEST_1_PASS: 'true',
      TEST_2_PASS: 'true',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'pipe',
    reject: false,
  })
  t.deepEqual(result1.exitCode, 1)
  t.true(
    result1.stderr.includes(
      'error: missing command to run after "--". valid example: test-retry --test-runner jest -- yarn jest',
    ),
  )
})
test('invalid command to run at the end', async t => {
  const { entryPath } = await createFolderStrucutre({
    entryName: 'project1',
    content: {
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: `${t.context.bin.testRetryPath} --test-runner jest --`,
        },
        jest: {
          reporters: ['default', jestSimpleJsonReporterPath],
        },
      },
      '__tests__/test1.spec.js': `
                          describe('1', () => {
                            test('test-passed1!', async () => {
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

  const result1 = await execa.command('yarn test', {
    cwd: entryPath,
    env: {
      SRC_MD5: '1',
      TEST_1_PASS: 'true',
      TEST_2_PASS: 'true',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'pipe',
    reject: false,
  })
  t.deepEqual(result1.exitCode, 1)
  t.true(
    result1.stderr.includes(
      'error: missing command to run after "--". valid example: test-retry --test-runner jest -- yarn jest',
    ),
  )
})
