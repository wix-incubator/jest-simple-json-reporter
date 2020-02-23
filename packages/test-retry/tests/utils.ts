import { TestInterface } from 'ava'
import * as execa from 'execa'
import * as isCi from 'is-ci'
import * as path from 'path'
import * as pkgUp from 'pkg-up'
import { promisify } from 'util'
import { TestContext } from './types'

const resolveBinPromise = promisify<string, string>(require('resolve-bin'))

export const ciEnv = 'BUILD_NUMBER'
export const jestSimpleJsonReporterPath = require.resolve('jest-simple-json-reporter')

export const installBabelPackages = async ({ cwd }: { cwd: string }): Promise<void> => {
  await execa.command('yarn', { cwd, stdio: 'ignore' })

  const packageJsonPaths = await Promise.all(
    [
      require.resolve('@babel/core'),
      require.resolve('@babel/plugin-proposal-class-properties'),
      require.resolve('@babel/plugin-proposal-decorators'),
      require.resolve('@babel/preset-env'),
    ].map(modulePath => pkgUp({ cwd: modulePath })),
  )

  const packagesPath = packageJsonPaths.map(packageJsonPath => path.dirname(packageJsonPath))

  await packagesPath
    .map(packagePath => () => execa.command(`yarn add link:${packagePath}`, { cwd, stdio: 'ignore' }))
    .reduce((acc, p) => acc.then(p), Promise.resolve())

  await execa.command('yarn', { cwd, stdio: 'ignore' })
}

export function binBeforeAfterEach(test: TestInterface<TestContext>) {
  test.beforeEach(async t => {
    const [jestPath, sledPath, tsNodePath] = await Promise.all([
      resolveBinPromise('jest'),
      resolveBinPromise('sled-test-runner'),
      resolveBinPromise('ts-node'),
    ])
    t.context.bin = {
      jestPath,
      sledPath,
      tsNodePath,
      testRetryPath: isCi ? require.resolve('../dist/index.js') : `${tsNodePath} ${require.resolve('../src/index.ts')}`,
    }
  })
}
