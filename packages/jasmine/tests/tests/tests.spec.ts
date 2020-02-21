import testWithTypedContext, { TestInterface } from 'ava'
import * as resolveBin from 'resolve-bin'
import {promisify} from 'util'
// import createFolderStrucutre from 'create-folder-structure'
// import * as execa from 'execa'
// import * as fse from 'fs-extra'
// import * as path from 'path'
// import * as fs from 'fs'
// import {JsonReporter} from 'test-json-reporter-api'
// import deepSort from '@wix/deep-sort'

const resolveBinPromise = promisify<string,string>(resolveBin)

export type TestContext = {
  cleanup: () => Promise<void>,
  jasminePath: string
}

const test = testWithTypedContext as TestInterface<TestContext>

test.before(async t => {
  t.timeout(100000)
  t.context.jasminePath = await resolveBinPromise('jasmine')
})

test.afterEach(async t => {
  // await t.context.cleanup()
})

// const jestSimpleJsonReporterPath = require.resolve('jasmine-simple-json-reporter')

test('1', async t => {
  t.pass()
})