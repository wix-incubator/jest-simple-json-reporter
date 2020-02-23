import * as fse from 'fs-extra'
import { hasKeyInS3, readFromS3, saveToS3 } from './s3'
import { TestJsonReporter, Options, TestRunner } from './types'
import * as execa from 'execa'
import * as path from 'path'

function escapeStringForValidRegex(str: string) {
  return str.replace(/(?=[[\](){}^$.?*+|\\"])/g, '\\')
}

function overridedUserCommand({ testRunner, report }: { report: TestJsonReporter; testRunner: TestRunner }): string {
  switch (testRunner) {
    case TestRunner.jest:
      const failedTestNames = report.filesResult
        .reduce((array, fileResult) => [...array, ...fileResult.testResults], [])
        .filter(testResult => !testResult.passed)
        .map(testResult => testResult.fullName)
        .map(escapeStringForValidRegex)
      return `-t "^${failedTestNames.join('|')}$"`
    case TestRunner.sled:
      const failedTestFiles = report.filesResult
        .filter(fileResult => !fileResult.passed)
        .map(fileResult => fileResult.path)
      return `-f "${failedTestFiles.join(' ')}"`
  }
  throw new Error('unsupported test-runner')
}

function getTestReportsS3Key({ srcMd5, cwd, userTestCommand }: Options) {
  return `${srcMd5}-${path.basename(cwd)}-${userTestCommand}`
}

function getS3Options(options: Options) {
  return {
    bucket: options.s3BucketNameForTestsReports,
    key: getTestReportsS3Key(options),
  }
}

async function saveReportsToS3(options: Options): Promise<void> {
  try {
    const report = await fse.readJSON(options.reportPath)
    await saveToS3({
      ...getS3Options(options),
      value: JSON.stringify(report),
    })
    console.log(
      'tests report was uploaded succesfully and will be used to execute only the tests that were failed in the next run - only if the project didnt change!',
    )
  } catch (e) {
    console.log(
      `couldn't upload report ${options.reportPath} to s3. all relevant tests under this report will run again in the next test-run`,
      JSON.stringify(e, null, 2),
    )
  }
}

async function runTests(options: Options, extraArgs?: string): Promise<void> {
  const command = extraArgs ? `${options.userTestCommand} ${extraArgs}` : options.userTestCommand
  console.log(options.cwd)
  console.log('command: ', command)
  try {
    await execa.command(command, {
      cwd: options.cwd,
      stdio: 'inherit',
      shell: true,
      env: {
        TEST_JSON_REPORTER_OUTPUT_PATH: options.reportPath,
      },
    })
  } finally {
    await saveReportsToS3(options)
  }
}

export async function runSpecificTests(options: Options): Promise<void> {
  if (options.skipAndRunUserCommand) {
    await execa
      .command(options.userTestCommand, {
        cwd: options.cwd,
        stdio: 'inherit',
        shell: true,
      })
      .catch(e => {
        console.error(e)
        throw e
      })
    return Promise.resolve()
  }
  const s3Options = getS3Options(options)
  try {
    const lastReportExists = await hasKeyInS3(s3Options)
    if (!lastReportExists) {
      console.log("couldn't find last test-reports for this project with the same md5. running all tests.")
      await runTests(options)
      return Promise.resolve()
    }

    const lastTestReport = await readFromS3({
      ...s3Options,
      mapper: value => JSON.parse(value) as TestJsonReporter,
    })

    if (lastTestReport.passed) {
      console.log(
        'skipping tests. all tests passed in last run. if you want to override it and run all tests again, do a dummy-commit that changes something in your package',
      )
      return Promise.resolve()
    }

    console.log('found last test-reports for this project. running only failed files')

    const joinedTestFailedToRun = overridedUserCommand({
      testRunner: options.testRunner,
      report: lastTestReport,
    })

    return runTests(options, joinedTestFailedToRun)
  } catch (e) {
    console.log(e)
    throw e
  }
}
