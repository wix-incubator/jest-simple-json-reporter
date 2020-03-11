import * as fse from 'fs-extra'
import { hasKeyInS3, readFromS3, saveToS3 } from './s3'
import { Options, TestRunner, S3Options } from './types'
import * as execa from 'execa'
import * as path from 'path'
import { JsonReporter, TestResult } from '@wix/test-json-reporter-api'

function escapeStringForValidRegex(str: string) {
  return str.replace(/(?=[[\](){}^$.?*+|\\"])/g, '\\')
}

function overridedUserCommand({
  userTestCommand,
  report,
  testRunner,
}: {
  userTestCommand: string
  report?: JsonReporter
  testRunner: TestRunner
}): { command: string; env?: { [key: string]: string } } {
  switch (testRunner) {
    case TestRunner.jest: {
      if (!report) {
        return {
          command: userTestCommand,
        }
      }
      const failedTestNames = report.filesResult
        .reduce<TestResult[]>((array, fileResult) => [...array, ...fileResult.testResults], [])
        .filter(testResult => testResult.didRun && !testResult.passed)
        .map(testResult => testResult.fullName)
        .map(escapeStringForValidRegex)
      return {
        command: `${userTestCommand} -t "^${failedTestNames.join('|')}$"`,
      }
    }
    case TestRunner.sledLocal:
    case TestRunner.sledRemote: {
      const env = {
        ...(testRunner === TestRunner.sledRemote && { KEEP_PATH_AS_IS: 'true' }),
        ENABLE_JSON_REPORTER: 'true',
      }
      if (!report) {
        return {
          command: userTestCommand,
          env,
        }
      }
      const failedTestFiles = report.filesResult
        .filter(fileResult => !fileResult.passed)
        .map(fileResult => fileResult.path)

      return {
        command: `${userTestCommand} -f "${failedTestFiles.join('|')}"`,
        env,
      }
    }
  }
}

function getTestReportsS3Key({ srcMd5, cwd, userTestCommand }: Options) {
  const directDirName = path.basename(cwd)
  return `${srcMd5}-${directDirName}-${userTestCommand}`
}

function getS3Options(options: Options): { bucket: string; key: string } {
  return {
    bucket: options.s3BucketNameForTestsReports,
    key: getTestReportsS3Key(options),
  }
}

async function saveReportsToS3(options: Options): Promise<void> {
  try {
    console.log('test-retry - searching for the test-report locally')
    const isReportExist = await new Promise(res => fse.exists(options.reportPath, res))
    if (!isReportExist) {
      throw new Error(
        `test-retry - test-report is missing locally in path: "${options.reportPath}". please check that you are using the appropriate test-reporter`,
      )
    }
    console.log(`test-retry - found test-report locally on path: "${options.reportPath}".`)
    const report = await fse.readJSON(options.reportPath)
    const s3Options = getS3Options(options)
    await saveToS3({
      ...s3Options,
      value: JSON.stringify(report),
    }).catch(e =>
      Promise.reject(
        new Error(
          `test-retry - could not save test-report in s3 bucket: "${s3Options.bucket}", in key: "${s3Options.key}".`,
        ),
      ),
    )
    console.log(
      `test-retry - tests report was uploaded succesfully to s3 bucket: "${s3Options.bucket}", in key: "${s3Options.key}". the test-report will be used to execute only the tests that were failed in the next run - only if the project didnt change!`,
    )
  } catch (e) {
    console.error(
      `test-retry - couldn't upload test report ${options.reportPath} to s3. all relevant tests under this report will run again in the next test-run`,
      e,
    )
  }
}

async function runTests(options: Options, command: string, env: { [key: string]: string }): Promise<void> {
  console.log('test-retry - test-command:', env ? JSON.stringify(env, null, 2) : '', command)
  try {
    await execa.command(command, {
      cwd: options.cwd,
      stdio: 'inherit',
      shell: true,
      env: {
        TEST_JSON_REPORTER_OUTPUT_PATH: options.reportPath,
        ...env,
      },
    })
  } finally {
    await saveReportsToS3(options)
  }
}

export async function runSpecificTests(options: Options): Promise<void> {
  if (options.skipAndRunUserCommand) {
    await execa.command(options.userTestCommand, {
      cwd: options.cwd,
      stdio: 'inherit',
      shell: true,
    })
    return Promise.resolve()
  }

  const { s3Options, lastReportExists } = await Promise.resolve().then<{
    s3Options?: S3Options
    lastReportExists: boolean
  }>(async () => {
    try {
      const s3Options = getS3Options(options)
      return {
        s3Options,
        lastReportExists: await hasKeyInS3(s3Options),
      }
    } catch (e) {
      console.error(
        'test-retry - error accured while communicating with s3 to see if last report exist. we continue such as the last report in s3 does not exist. error: ',
        e,
      )
      return {
        lastReportExists: false,
      }
    }
  })

  console.log(
    `test-retry - searching last report in s3-bucket-name: "${s3Options.bucket}", s3-bucket-key: "${s3Options.key}"`,
  )

  if (!lastReportExists) {
    console.log(
      "test-retry - couldn't find last test-reports remotly for this project with the same md5. running all tests.",
    )
    const { command, env } = overridedUserCommand({
      userTestCommand: options.userTestCommand,
      testRunner: options.testRunner,
    })
    await runTests(options, command, env)
    return Promise.resolve()
  }

  const { lastTestReport } = await readFromS3({
    ...s3Options,
    mapper: value => ({ lastTestReport: JSON.parse(value) as JsonReporter }),
  }).catch<{ lastTestReport?: JsonReporter }>(e => {
    console.error(
      `test-retry - error accured while communicating with s3 to download last test report.  we continue such as the last report in s3 does not exist. error: `,
      e,
    )
    return {}
  })

  if (!lastTestReport) {
    const { command, env } = overridedUserCommand({
      userTestCommand: options.userTestCommand,
      testRunner: options.testRunner,
    })
    await runTests(options, command, env)
    return Promise.resolve()
  }

  if (lastTestReport.passed) {
    console.log(
      'test-retry - skipping tests. all tests passed in last run. if you want to override it and run all tests again, do a dummy-commit that changes something in your package',
    )
    return Promise.resolve()
  }

  console.log('test-retry - found last test-reports for this project. running only failed files')

  const { command, env } = overridedUserCommand({
    userTestCommand: options.userTestCommand,
    testRunner: options.testRunner,
    report: lastTestReport,
  })

  await runTests(options, command, env)
  return Promise.resolve()
}
