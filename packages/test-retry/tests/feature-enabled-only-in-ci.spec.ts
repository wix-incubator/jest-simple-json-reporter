import testWithTypedContext, { TestInterface } from 'ava'
import { createFolder } from 'create-folder-structure'
import * as execa from 'execa'
import { s3BeforeAfterEach } from './s3-mock-setup'
import { TestContext } from './types'
import { binBeforeAll, ciEnv, jestSimpleJsonReporterPath } from './dependencies-setup'

const test = testWithTypedContext as TestInterface<TestContext>

s3BeforeAfterEach(test)

binBeforeAll(test)

test('should not enable the feature so all the tests should run twice', async t => {
  const generateProject = () =>
    createFolder({
      'package.json': {
        name: 'test-project',
        license: 'MIT',
        scripts: {
          test: `${t.context.bin.testRetryPath} --enabled false --test-runner jest -- ${t.context.bin.jestPath}`,
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
      '__tests__/test2.spec.js': `
                          describe('2', () => {
                            test('test-passed1!', async () => {
                                if (process.env['TEST_2_PASS'] === 'true') {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
    })

  const project1EntryPath = await generateProject()
  const result1 = await execa.command('yarn test', {
    cwd: project1EntryPath,
    env: {
      SRC_MD5: '1',
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

  const project2EntryPath = await generateProject()

  const result2 = await execa.command('yarn test', {
    cwd: project2EntryPath,
    env: {
      SRC_MD5: '1',
      TEST_1_PASS: 'false',
      TEST_2_PASS: 'false',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'ignore',
    reject: false,
  })
  t.deepEqual(result2.exitCode, 1)
})
