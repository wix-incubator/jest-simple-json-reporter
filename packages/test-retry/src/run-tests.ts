import * as fse from 'fs-extra'
import { hasKeyInS3, readFromS3, saveToS3 } from './s3'
import { TestJsonReporter, Options, TestRunner, S3Options } from './types'
import * as execa from 'execa'
import * as path from 'path'

function escapeStringForValidRegex(str: string) {
  return str.replace(/(?=[[\](){}^$.?*+|\\"])/g, '\\')
}

function overridedUserCommand({
  userTestCommand,
  report,
  testRunner,
}: {
  userTestCommand: string
  report?: TestJsonReporter
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
        .reduce((array, fileResult) => [...array, ...fileResult.testResults], [])
        .filter(testResult => !testResult.passed)
        .map(testResult => testResult.fullName)
        .map(escapeStringForValidRegex)
      return {
        command: `${userTestCommand} -t "^${failedTestNames.join('|')}$"`,
      }
    }
    case TestRunner.sled: {
      const env = {
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
        command: `${userTestCommand} -f "${failedTestFiles.join(' ')}"`,
        env,
      }
    }
  }
}

function getTestReportsS3Key({ srcMd5, cwd, userTestCommand }: Options) {
  return `${srcMd5}-${path.basename(cwd)}-${userTestCommand}`
}

function getS3Options(options: Options): { bucket: string; key: string } {
  return {
    bucket: options.s3BucketNameForTestsReports,
    key: getTestReportsS3Key(options),
  }
}

async function saveReportsToS3(options: Options): Promise<void> {
  try {
    console.log('searching for the test-report locally')
    const isReportExist = await new Promise(res => fse.exists(options.reportPath, res))
    if (!isReportExist) {
      throw new Error(
        `test-report is missing locally in path: "${options.reportPath}". please check that you are using the appropriate test-reporter`,
      )
    }
    console.log(`found test-report locally on path: "${options.reportPath}".`)
    const report = await fse.readJSON(options.reportPath)
    await saveToS3({
      ...getS3Options(options),
      value: JSON.stringify(report),
    })
    console.log(
      'tests report was uploaded succesfully and will be used to execute only the tests that were failed in the next run - only if the project didnt change!',
    )
  } catch (e) {
    console.error(
      `couldn't upload test report ${options.reportPath} to s3. all relevant tests under this report will run again in the next test-run`,
      e,
    )
  }
}

async function runTests(options: Options, command: string, env?: { [key: string]: string }): Promise<void> {
  console.log('test-command: ', JSON.stringify(env, null, 2), command)
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
        'error accured while communicating with s3 to see if last report exist. we continue such as the last report in s3 does not exist. error: ',
        e,
      )
      return {
        lastReportExists: false,
      }
    }
  })

  if (!lastReportExists) {
    console.log("couldn't find last test-reports remotly for this project with the same md5. running all tests.")
    const { command, env } = overridedUserCommand({
      userTestCommand: options.userTestCommand,
      testRunner: options.testRunner,
    })
    await runTests(options, command, env)
    return Promise.resolve()
  }

  const { lastTestReport } = await readFromS3({
    ...s3Options,
    mapper: value => ({ lastTestReport: JSON.parse(value) as TestJsonReporter }),
  }).catch<{ lastTestReport?: TestJsonReporter }>(e => {
    console.error(
      `error accured while communicating with s3 to download last test report.  we continue such as the last report in s3 does not exist. error: `,
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
      'skipping tests. all tests passed in last run. if you want to override it and run all tests again, do a dummy-commit that changes something in your package',
    )
    return Promise.resolve()
  }

  console.log('found last test-reports for this project. running only failed files')

  const { command, env } = overridedUserCommand({
    userTestCommand: options.userTestCommand,
    testRunner: options.testRunner,
    report: lastTestReport,
  })

  await runTests(options, command, env)
  return Promise.resolve()
}
