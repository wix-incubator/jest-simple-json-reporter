import { TestInterface } from 'ava'
import * as execa from 'execa'
import * as fse from 'fs-extra'
import * as path from 'path'
import * as isCi from 'is-ci'
import * as pkgUp from 'pkg-up'
import { promisify } from 'util'
import { TestContext } from './types'
import { createFolder } from 'create-folder-structure'

const resolveBinPromise = promisify<string, string>(require('resolve-bin'))

export const ciEnv = 'BUILD_NUMBER'
export const jestSimpleJsonReporterPath = require.resolve('jest-simple-json-reporter')

export function binBeforeAll(test: TestInterface<TestContext>, { withSled }: { withSled?: boolean } = {}) {
  test.before(async t => {
    const [jestPath, tsNodePath] = await Promise.all([resolveBinPromise('jest'), resolveBinPromise('ts-node')])

    t.context.bin = {
      jestPath,
      tsNodePath,
      testRetryPath: isCi ? require.resolve('../dist/index.js') : `${tsNodePath} ${require.resolve('../src/index.ts')}`,
    }
    if (withSled) {
      const moduleName = 'sled-test-runner'
      const pkgJsonPath = await pkgUp({
        cwd: require.resolve(moduleName),
      })
      const moduleVersion = require(pkgJsonPath).version

      t.context.sledVersion = moduleVersion

      const entryPath = await createFolder({
        'package.json': {
          name: 'project',
          license: 'MIT',
        },
      })

      // im creating a yarn.lock with sled, then we the same lock file in all temp-projects so the installation will be faster.
      await execa.command(`yarn add --dev --registry "http://npm.dev.wixpress.com/" ${moduleName}@${moduleVersion}`, {
        cwd: entryPath,
        shell: true,
      })
      t.context.sledProjectLockFilePath = path.join(entryPath, 'yarn.lock')
    }
  })
}

export async function installSledProject({
  cwd,
  sledProjectLockFilePath,
}: { cwd: string } & TestContext): Promise<void> {
  await fse.copy(sledProjectLockFilePath, path.join(cwd, 'yarn.lock'))
  await execa.command(`yarn install`, {
    cwd,
    shell: true,
  })
  await execa.command('echo "node_modules" >> .gitignore && git init && git add . && git commit -am "init"', {
    cwd,
    shell: true,
  })
}
