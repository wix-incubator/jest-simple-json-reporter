import { TestInterface } from 'ava'
import * as isCi from 'is-ci'
import { promisify } from 'util'
import { TestContext } from './types'
import * as execa from 'execa'
import * as pkgUp from 'pkg-up'
import * as path from 'path'

const resolveBinPromise = promisify<string, string>(require('resolve-bin'))

export const ciEnv = 'BUILD_NUMBER'
export const jestSimpleJsonReporterPath = require.resolve('jest-simple-json-reporter')

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

export async function installSledLocalRequirements({ cwd }: { cwd: string }): Promise<void> {
  const installPackage = async (moduleName: string) => {
    if (isCi) {
      // note: in ci, for some reason, `yarn add --dev file:...` doesn't work so this is a slower workaround.
      await execa.command(`yarn add --dev ${moduleName}`, { cwd })
    } else {
      const pkgJsonPath = await pkgUp({
        cwd: require.resolve(moduleName),
      })
      const packageJsonDirPath = path.dirname(pkgJsonPath)
      // note: `yarn add --dev link:...` sometimes failes so this is a slower workaround.
      await execa.command(`yarn add --dev file:${packageJsonDirPath}`, { cwd })
    }
  }
  await installPackage('@babel/core')
  await installPackage('@babel/plugin-proposal-class-properties')
  await installPackage('@babel/plugin-proposal-decorators')
  await installPackage('@babel/preset-env')
}
