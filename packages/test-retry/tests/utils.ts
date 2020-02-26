import { TestInterface } from 'ava'
import * as isCi from 'is-ci'
import { promisify } from 'util'
import { TestContext } from './types'

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
