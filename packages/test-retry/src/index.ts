#!/usr/bin/env node
import * as yargs from 'yargs'
import { Options } from './types'
import * as path from 'path'
import * as isCi from 'is-ci'
import { runSpecificTests } from './run-tests'

const chance = require('chance')

process.on('unhandledRejection', (a, b) => {
  // eslint-disable-next-line no-process-exit
  process.exit(1)
})

function main() {
  const argv = yargs.options({
    'test-runner': { type: 'string', choices: ['jest', 'sled'], demandOption: true },
    enabled: { type: 'boolean', default: isCi },
  }).argv

  if (!argv._ || argv._.length === 0) {
    console.error('error: missing command to run after "--". valid example: test-retry --test-runner jest -- yarn jest')
    return Promise.reject()
  }

  const cwd = process.cwd()
  const options: Options = {
    cwd,
    reportPath: path.join(cwd, `test-report-${chance().hash()}.json`),
    s3BucketNameForTestsReports: 'wix-ci-results',
    srcMd5: process.env.SRC_MD5 as Options['srcMd5'],
    testRunner: argv['test-runner'] as Options['testRunner'],
    userTestCommand: argv._.join(' '),
    skipAndRunUserCommand: !argv.enabled,
  }

  return runSpecificTests(options)
}

main()
