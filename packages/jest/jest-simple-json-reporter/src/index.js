const fse = require('fs-extra')
const fs = require('fs')

function calculatePath(cwd, testFilePath, { useAbsolutePaths, keepPathAsIs }) {
  try {
    if (keepPathAsIs) {
      return testFilePath
    }
    const realTestFilePath = fs.realpathSync(testFilePath)
    return useAbsolutePaths ? realTestFilePath : realTestFilePath.replace(`${cwd}`, '.')
  } catch (e) {
    return 'test-file-path-not-found'
  }
}

module.exports = class JestSimpleJsonReporter {
  constructor(globalConfig, options = {}) {
    this.outputPath =
      process.env['TEST_JSON_REPORTER_OUTPUT_PATH'] || options.outputPath || './jest-simple-json-reporter-results.json'
    this.useAbsolutePaths =
      process.env['TEST_JSON_REPORTER_USE_ABSOLUTE_PATHS'] === 'true' || options.useAbsolutePaths || false
    this.keepPathAsIs = process.env['KEEP_PATH_AS_IS']
  }

  onRunComplete(contexts, results) {
    try {
      console.log(`test-retry - original-jest-report: ${JSON.stringify(results, null, 2)}`)
      const summary = {
        filesResult: (results.testResults || [])
          .map(fileResult => {
            return {
              path: calculatePath(process.cwd(), fileResult.testFilePath, this),
              testResults: (fileResult.testResults || []).map(testResult => ({
                didRun: testResult.status === 'failed' || testResult.status === 'passed',
                passed: testResult.status === 'passed',
                fullName: testResult.fullName,
              })),
            }
          })
          .map(fileResult => ({
            ...fileResult,
            passed: fileResult.testResults.every(testReuslt => !testReuslt.didRun || testReuslt.passed),
          })),
      }

      const passed = summary.filesResult.every(fileResult => fileResult.passed)
      const finalSummary = { passed, ...summary }

      fse.writeFileSync(this.outputPath, JSON.stringify(finalSummary, null, 2))
    } catch (e) {
      console.error(
        `test-retry - jest-simple-json-reporter - failed to eveluate and save jest report to: "${
          this.outputPath
        }" : ${JSON.stringify(results, null, 2)} - error:`,
        e,
      )
    }
  }
}
