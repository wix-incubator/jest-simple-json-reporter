import testWithTypedContext, { TestInterface } from 'ava'
import createFolderStrucutre from 'create-folder-structure'
import * as execa from 'execa'
import { binBeforeAll, ciEnv, installSledProject } from './dependencies-setup'
import { s3BeforeAfterEach } from './s3-mock-setup'
import { TestContext } from './types'
import * as isCi from 'is-ci'

const testAva = testWithTypedContext as TestInterface<TestContext>

s3BeforeAfterEach(testAva)

binBeforeAll(testAva, { withSled: true })

const test = isCi ? testAva.serial : testAva

test('mode:local - single test - fail -> pass -> skip', async t => {
  const generateProject = async ({ test1_1Pass }: { test1_1Pass: boolean }) => {
    const result = await createFolderStrucutre({
      entryName: 'project1',
      content: {
        'package.json': {
          name: 'test-project',
          license: 'MIT',
          scripts: {
            test: `${t.context.bin.testRetryPath} --test-runner sled-local -- sled-test-runner local`,
          },
          devDependencies: {
            'sled-test-runner': t.context.sledVersion,
          },
        },
        '.npmrc': 'registry=http://npm.dev.wixpress.com/',
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
                                if (${test1_1Pass}) {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
      },
    })
    await installSledProject({ cwd: result.entryPath, ...t.context })
    return result
  }

  const project1 = await generateProject({ test1_1Pass: false })
  const result1 = await execa.command('yarn test', {
    cwd: project1.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    reject: false,
  })
  t.deepEqual(result1.exitCode, 1)

  const project2 = await generateProject({ test1_1Pass: true })
  const result2 = await execa.command('yarn test', {
    cwd: project2.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
  })
  t.deepEqual(result2.exitCode, 0)

  const project3 = await generateProject({ test1_1Pass: false })
  const result3 = await execa.command('yarn test', {
    cwd: project3.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'pipe',
  })
  t.deepEqual(result3.exitCode, 0)
  t.true(result3.stdout.includes('skipping tests. all tests passed in last run.'))
})

test('mode:local - multiple test files - some fail -> pass -> skip', async t => {
  const generateProject = async ({
    test1_1Pass,
    test2_1Pass,
    test3_1Pass,
  }: {
    test1_1Pass: boolean
    test2_1Pass: boolean
    test3_1Pass: boolean
  }) => {
    const result = await createFolderStrucutre({
      entryName: 'project1',
      content: {
        'package.json': {
          name: 'test-project',
          license: 'MIT',
          scripts: {
            test: `${t.context.bin.testRetryPath} --test-runner sled-local -- sled-test-runner local`,
          },
          devDependencies: {
            'sled-test-runner': t.context.sledVersion,
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
        'sled/dir1/dir-2-2-2-2/test1.spec.js': `
                          describe('1', () => {
                            test('1.1', async () => {
                                if (${test1_1Pass}) {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
        'sled/dir1/dir3/test2.spec.js': `
                          describe('2', () => {
                            test('2.1', async () => {
                                if (${test2_1Pass}) {
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
                                if (${test3_1Pass}) {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
      },
    })
    await installSledProject({ cwd: result.entryPath, ...t.context })
    return result
  }

  const project1 = await generateProject({ test1_1Pass: false, test2_1Pass: false, test3_1Pass: true })

  const result1 = await execa.command('yarn test', {
    cwd: project1.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    reject: false,
  })
  t.deepEqual(result1.exitCode, 1)

  const project2 = await generateProject({ test1_1Pass: true, test2_1Pass: true, test3_1Pass: false })
  const result2 = await execa.command('yarn test', {
    cwd: project2.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
  })
  t.deepEqual(result2.exitCode, 0)

  const project3 = await generateProject({ test1_1Pass: false, test2_1Pass: false, test3_1Pass: false })
  const result3 = await execa.command('yarn test', {
    cwd: project3.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'pipe',
  })
  t.deepEqual(result3.exitCode, 0)
  t.true(result3.stdout.includes('skipping tests. all tests passed in last run.'))
})

test('mode:local - multiple test files - all fail -> pass -> skip', async t => {
  const generateProject = async ({
    test1_1Pass,
    test2_1Pass,
    test3_1Pass,
  }: {
    test1_1Pass: boolean
    test2_1Pass: boolean
    test3_1Pass: boolean
  }) => {
    const result = await createFolderStrucutre({
      entryName: 'project1',
      content: {
        'package.json': {
          name: 'test-project',
          license: 'MIT',
          scripts: {
            test: `${t.context.bin.testRetryPath} --test-runner sled-local -- sled-test-runner local`,
          },
          devDependencies: {
            'sled-test-runner': t.context.sledVersion,
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
                                if (${test1_1Pass}) {
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
                                if (${test2_1Pass}) {
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
                                if (${test3_1Pass}) {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
      },
    })
    await installSledProject({ cwd: result.entryPath, ...t.context })
    return result
  }

  const project1 = await generateProject({ test1_1Pass: false, test2_1Pass: false, test3_1Pass: false })

  const result1 = await execa.command('yarn test', {
    cwd: project1.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    reject: false,
  })
  t.deepEqual(result1.exitCode, 1)

  const project2 = await generateProject({ test1_1Pass: true, test2_1Pass: true, test3_1Pass: true })
  const result2 = await execa.command('yarn test', {
    cwd: project2.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
  })
  t.deepEqual(result2.exitCode, 0)

  const project3 = await generateProject({ test1_1Pass: false, test2_1Pass: false, test3_1Pass: false })
  const result3 = await execa.command('yarn test', {
    cwd: project3.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'pipe',
  })
  t.deepEqual(result3.exitCode, 0)
  t.true(result3.stdout.includes('skipping tests. all tests passed in last run.'))
})

test('mode:local - multiple test files - all pass -> skip', async t => {
  const generateProject = async ({
    test1_1Pass,
    test2_1Pass,
    test3_1Pass,
  }: {
    test1_1Pass: boolean
    test2_1Pass: boolean
    test3_1Pass: boolean
  }) => {
    const result = await createFolderStrucutre({
      entryName: 'project1',
      content: {
        'package.json': {
          name: 'test-project',
          license: 'MIT',
          scripts: {
            test: `${t.context.bin.testRetryPath} --test-runner sled-local -- sled-test-runner local`,
          },
          devDependencies: {
            'sled-test-runner': t.context.sledVersion,
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
                                if (${test1_1Pass}) {
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
                                if (${test2_1Pass}) {
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
                                if (${test3_1Pass}) {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
      },
    })
    await installSledProject({ cwd: result.entryPath, ...t.context })
    return result
  }

  const project1 = await generateProject({ test1_1Pass: true, test2_1Pass: true, test3_1Pass: true })
  const result1 = await execa.command('yarn test', {
    cwd: project1.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
  })
  t.deepEqual(result1.exitCode, 0)

  const project2 = await generateProject({ test1_1Pass: false, test2_1Pass: false, test3_1Pass: false })
  const result2 = await execa.command('yarn test', {
    cwd: project2.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'pipe',
  })
  t.deepEqual(result2.exitCode, 0)
  t.true(result2.stdout.includes('skipping tests. all tests passed in last run.'))
})

test('mode:remote - single test - fail -> pass -> skip', async t => {
  const generateProject = async ({ test1_1Pass }: { test1_1Pass: boolean }) => {
    const result = await createFolderStrucutre({
      entryName: 'project1',
      content: {
        'package.json': {
          name: 'test-project',
          license: 'MIT',
          scripts: {
            test: `${t.context.bin.testRetryPath} --test-runner sled-local -- sled-test-runner local`,
          },
          devDependencies: {
            'sled-test-runner': t.context.sledVersion,
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
                                if (${test1_1Pass}) {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
      },
    })
    await installSledProject({ cwd: result.entryPath, ...t.context })
    return result
  }

  const project1 = await generateProject({ test1_1Pass: false })

  const result1 = await execa.command('yarn test', {
    cwd: project1.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    reject: false,
  })
  t.deepEqual(result1.exitCode, 1)

  const project2 = await generateProject({ test1_1Pass: true })
  const result2 = await execa.command('yarn test', {
    cwd: project2.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
  })
  t.deepEqual(result2.exitCode, 0)

  const project3 = await generateProject({ test1_1Pass: false })
  const result3 = await execa.command('yarn test', {
    cwd: project3.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'pipe',
  })
  t.deepEqual(result3.exitCode, 0)
  t.true(result3.stdout.includes('skipping tests. all tests passed in last run.'))
})

test('mode:remote - multiple test files - some fail -> pass -> skip', async t => {
  const generateProject = async ({
    test1_1Pass,
    test2_1Pass,
    test3_1Pass,
  }: {
    test1_1Pass: boolean
    test2_1Pass: boolean
    test3_1Pass: boolean
  }) => {
    const result = await createFolderStrucutre({
      entryName: 'project1',
      content: {
        'package.json': {
          name: 'test-project',
          license: 'MIT',
          scripts: {
            test: `${t.context.bin.testRetryPath} --test-runner sled-local -- sled-test-runner local`,
          },
          devDependencies: {
            'sled-test-runner': t.context.sledVersion,
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
        'sled/dir1/dir-2-2-2-2/test1.spec.js': `
                          describe('1', () => {
                            test('1.1', async () => {
                                if (${test1_1Pass}) {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
        'sled/dir1/dir3/test2.spec.js': `
                          describe('2', () => {
                            test('2.1', async () => {
                                if (${test2_1Pass}) {
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
                                if (${test3_1Pass}) {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
      },
    })
    await installSledProject({ cwd: result.entryPath, ...t.context })
    return result
  }

  const project1 = await generateProject({ test1_1Pass: false, test2_1Pass: false, test3_1Pass: true })

  const result1 = await execa.command('yarn test', {
    cwd: project1.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    reject: false,
  })
  t.deepEqual(result1.exitCode, 1)

  const project2 = await generateProject({ test1_1Pass: true, test2_1Pass: true, test3_1Pass: false })
  const result2 = await execa.command('yarn test', {
    cwd: project2.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
  })
  t.deepEqual(result2.exitCode, 0)

  const project3 = await generateProject({ test1_1Pass: false, test2_1Pass: false, test3_1Pass: false })
  const result3 = await execa.command('yarn test', {
    cwd: project3.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'pipe',
  })
  t.deepEqual(result3.exitCode, 0)
  t.true(result3.stdout.includes('skipping tests. all tests passed in last run.'))
})

test('mode:remote - multiple test files - all fail -> pass -> skip', async t => {
  const generateProject = async ({
    test1_1Pass,
    test2_1Pass,
    test3_1Pass,
  }: {
    test1_1Pass: boolean
    test2_1Pass: boolean
    test3_1Pass: boolean
  }) => {
    const result = await createFolderStrucutre({
      entryName: 'project1',
      content: {
        'package.json': {
          name: 'test-project',
          license: 'MIT',
          scripts: {
            test: `${t.context.bin.testRetryPath} --test-runner sled-local -- sled-test-runner local`,
          },
          devDependencies: {
            'sled-test-runner': t.context.sledVersion,
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
                                if (${test1_1Pass}) {
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
                                if (${test2_1Pass}) {
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
                                if (${test3_1Pass}) {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
      },
    })
    await installSledProject({ cwd: result.entryPath, ...t.context })
    return result
  }

  const project1 = await generateProject({ test1_1Pass: false, test2_1Pass: false, test3_1Pass: false })

  const result1 = await execa.command('yarn test', {
    cwd: project1.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    reject: false,
  })
  t.deepEqual(result1.exitCode, 1)

  const project2 = await generateProject({ test1_1Pass: true, test2_1Pass: true, test3_1Pass: true })
  const result2 = await execa.command('yarn test', {
    cwd: project2.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
  })
  t.deepEqual(result2.exitCode, 0)

  const project3 = await generateProject({ test1_1Pass: false, test2_1Pass: false, test3_1Pass: false })
  const result3 = await execa.command('yarn test', {
    cwd: project3.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'pipe',
  })
  t.deepEqual(result3.exitCode, 0)
  t.true(result3.stdout.includes('skipping tests. all tests passed in last run.'))
})

test('mode:remote - multiple test files - all pass -> skip', async t => {
  const generateProject = async ({
    test1_1Pass,
    test2_1Pass,
    test3_1Pass,
  }: {
    test1_1Pass: boolean
    test2_1Pass: boolean
    test3_1Pass: boolean
  }) => {
    const result = await createFolderStrucutre({
      entryName: 'project1',
      content: {
        'package.json': {
          name: 'test-project',
          license: 'MIT',
          scripts: {
            test: `${t.context.bin.testRetryPath} --test-runner sled-local -- sled-test-runner local`,
          },
          devDependencies: {
            'sled-test-runner': t.context.sledVersion,
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
                                if (${test1_1Pass}) {
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
                                if (${test2_1Pass}) {
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
                                if (${test3_1Pass}) {
                                    expect(1).toEqual(1)
                                  } else {
                                    expect(1).toEqual(2)
                                  }
                              })
                          })
                          `,
      },
    })
    await installSledProject({ cwd: result.entryPath, ...t.context })
    return result
  }

  const project1 = await generateProject({ test1_1Pass: true, test2_1Pass: true, test3_1Pass: true })
  const result1 = await execa.command('yarn test', {
    cwd: project1.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
  })
  t.deepEqual(result1.exitCode, 0)

  const project2 = await generateProject({ test1_1Pass: false, test2_1Pass: false, test3_1Pass: false })
  const result2 = await execa.command('yarn test', {
    cwd: project2.entryPath,
    env: {
      SRC_MD5: '1',
      [ciEnv]: 'true',
      NPM_CI_AWS_ACCESS_KEY: t.context.s3.accessKeyId,
      NPM_CI_AWS_SECRET_ACCESS_KEY: t.context.s3.secretAccessKey,
      NPM_CI_AWS_S3_ADDRESS: t.context.s3.s3Address,
    },
    stdio: 'pipe',
  })
  t.deepEqual(result2.exitCode, 0)
  t.true(result2.stdout.includes('skipping tests. all tests passed in last run.'))
})
