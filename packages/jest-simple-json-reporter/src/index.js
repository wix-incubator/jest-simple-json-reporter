const fse = require('fs-extra')
const fs = require('fs')

module.exports = class JestSimpleJsonReporter {
  constructor(globalConfig, options = {}) {
    this.outputPath = options.outputPath || './jest-simple-json-reporter-results.json'
  }
  onRunComplete(contexts, results) {
    const summary = {
      filesResult: (results.testResults || [])
        .map(fileResult => ({
          path: fs.realpathSync(fileResult.testFilePath),
          testResults: (fileResult.testResults || []).map(testResult => ({
            didRun: testResult.status === 'failed' || testResult.status === 'passed',
            passed: testResult.status === 'passed',
            fullName: testResult.fullName,
          })),
        }))
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
