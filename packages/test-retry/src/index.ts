#!/usr/bin/env node
import yargs from 'yargs'
import { Options } from './types'
import path from 'path'
import isCi from 'is-ci'
import { runSpecificTests } from './run-tests'

const chance = require('chance')

process.on('unhandledRejection', (a, b) => {
  if (process.env['TEST_RETRY_TEST_MODE']) {
    // in production, if a test failes, the test-runner exit with code !== 0 so we will get here always. to avoid node's message that we didn't catch the exacption, we ignore it.
    // in local development of test-retry, some errors will be ignored if we dont print them.
    console.error(a, b)
  }
  process.exitCode = 1
})

function main() {
  const argv = yargs.options({
    'test-runner': { type: 'string', choices: ['jest', 'sled-local', 'sled-remote'], demandOption: true },
    enabled: { type: 'boolean', default: isCi },
  }).argv

  if (!argv._ || argv._.length === 0) {
    console.error(
      'test-retry - error: missing command to run after "--". valid example: test-retry --test-runner jest -- yarn jest',
    )
    return Promise.reject()
  }

  const cwd = process.cwd()
  const options: Options = {
    cwd,
    reportPath: path.join(cwd, `test-report-${chance().hash()}.json`),
    s3BucketNameForTestsReports: 'wix-ci-results',
    srcMd5: process.env['SRC_MD5'] as Options['srcMd5'],
    testRunner: argv['test-runner'] as Options['testRunner'],
    userTestCommand: argv._.join(' '),
    skipAndRunUserCommand: !argv.enabled,
  }

  return runSpecificTests(options)
}

main()
