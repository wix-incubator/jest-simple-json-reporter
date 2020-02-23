import testWithTypedContext, { TestInterface } from 'ava'
import createFolderStrucutre from 'create-folder-structure'
import * as execa from 'execa'
import { ciEnv } from './utils'
import { s3BeforeAfterEach } from './s3-mock-setup'
import { TestContext } from './types'
import { installBabelPackages, binBeforeAfterEach } from './utils'

const test = testWithTypedContext as TestInterface<TestContext>

s3BeforeAfterEach(test)

binBeforeAfterEach(test)

test('one test fail in first run and then pass in second run', async t => {
  const generateProject = async () => {
    const result = await createFolderStrucutre({
      entryName: 'project1',
      content: {
        'package.json': {
          name: 'test-project',
          license: 'MIT',
          scripts: {
            test: `${t.context.bin.testRetryPath} --test-runner sled -- ${t.context.bin.sledPath} local`,
          },
        },
        'pom.xml': `
                    <?xml version="1.0" encoding="UTF-8"?>
                        <project>
                            <modelVersion>4.0.0</modelVersion>
                            <groupId>com.wixpress</groupId>
                            <artifactId>hello-stav-2</artifactId>
                            <packaging>pom</packaging>
                            <version>1.0.0-SNAPSHOT</version>
                        </project>
                    `,
        'dist/statics/index.min.js': "console.log('hi')",
        'sled/sled.json': {
          artifacts_upload: {
            patterns: ['**/*.min.js'],
          },
          sled_folder_relative_path_in_repo: 'sled',
        },
        'sled/test1.spec.js': `
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
        'sled/test2.spec.js': `
                          describe('2', () => {
                            test('2.1', async () => {
                                if (process.env['TEST_1_PASS'] === 'true') {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
        'sled/test3.spec.js': `
                          describe('3', () => {
                            test('3.1', async () => {
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
    await installBabelPackages({ cwd: result.entryPath })
    await execa.command('git init && git add --all && git commit -am "init"', {
      cwd: result.entryPath,
      shell: true,
    })
    return result
  }

  const project1 = await generateProject()

  const result1 = await execa.command('yarn test', {
    cwd: project1.entryPath,
    env: {
      srcMd5: '1',
      TEST_1_PASS: 'false',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'inherit',
  })
  t.deepEqual(result1.exitCode, 0)

  const project2 = await generateProject()
  const result2 = await execa.command('yarn test', {
    cwd: project2.entryPath,
    env: {
      srcMd5: '1',
      TEST_1_PASS: 'true',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'inherit',
  })
  t.deepEqual(result2.exitCode, 0)

  const project3 = await generateProject()
  const result3 = await execa.command('yarn test', {
    cwd: project3.entryPath,
    env: {
      srcMd5: '1',
      TEST_1_PASS: 'false',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'inherit',
  })
  t.deepEqual(result3.exitCode, 0)
})
