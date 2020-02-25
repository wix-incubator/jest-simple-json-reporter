import testWithTypedContext, { TestInterface } from 'ava'
import createFolderStrucutre from 'create-folder-structure'
import * as execa from 'execa'
import { s3BeforeAfterEach } from './s3-mock-setup'
import { TestContext } from './types'
import { binBeforeAfterEach, ciEnv } from './utils'

const test = testWithTypedContext as TestInterface<TestContext>

s3BeforeAfterEach(test)

binBeforeAfterEach(test)

test('no reporter but all tests pass in first run and yet, the tests will run again in second time (and we make sure they will fail in second time)', async t => {
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

  const project1 = await generateProject()

  const result1 = await execa.command('yarn test', {
    cwd: project1.entryPath,
    env: {
      srcMd5: '1',
      TEST_1_PASS: 'true',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'pipe',
  })
  t.deepEqual(result1.exitCode, 0)
  t.true(result1.stderr.includes('test-report is missing locally'))

  const project2 = await generateProject()

  const result2 = await execa.command('yarn test', {
    cwd: project2.entryPath,
    env: {
      srcMd5: '1',
      TEST_1_PASS: 'false',
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
