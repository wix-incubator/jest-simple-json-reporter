const fse = require('fs-extra')
const fs = require('fs')

module.exports = class JestSimpleJsonReporter {
  constructor(globalConfig, options = {}) {
    this.outputPath =
      process.env['TEST_JSON_REPORTER_OUTPUT_PATH'] || options.outputPath || './jest-simple-json-reporter-results.json'
    this.useAbsolutePaths =
      process.env['TEST_JSON_REPORTER_USE_ABSOLUTE_PATHS'] === 'true' || options.useAbsolutePaths || false
  }
  onRunComplete(contexts, results) {
    const summary = {
      filesResult: (results.testResults || [])
        .map(fileResult => {
          const testFilePath = fs.realpathSync(fileResult.testFilePath)
          return {
            path: this.useAbsolutePaths ? testFilePath : testFilePath.replace(`${process.cwd()}`, '.'),
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
  }
}
