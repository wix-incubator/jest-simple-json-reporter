const fse = require('fs-extra')

module.exports = (options = {}) => {
  const outputPath =
    process.env['TEST_JSON_REPORTER_OUTPUT_PATH'] || options.outputPath || './jasmine-simple-json-reporter-results.json'
  const specs = []
  return {
    specDone(spec) {
      specs.push(spec)
    },

    jasmineDone(summary) {
      const report = {
        passed: summary.overallStatus === 'passed',
        filesResult: specs.map(spec => ({
          passed: spec.status === 'passed',
          path: 'not specified',
          testResults: [
            {
              didRun: spec.status !== 'pending',
              passed: spec.status === 'passed',
              fullName: spec.fullName,
            },
          ],
        })),
      }

      fse.writeFileSync(outputPath, JSON.stringify(report, null, 2))
    },
  }
}
