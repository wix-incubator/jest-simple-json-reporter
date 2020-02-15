const fse = require('fs-extra')

module.exports = class JestSimpleJsonReporter {
  constructor(globalConfig, options = {}) {
    this.outputPath = options.outputPath || './jest-simple-json-reporter-results.json'
  }
  onRunComplete(contexts, results) {
    fse.writeFile(this.outputPath, JSON.stringify(results, null, 2))
  }
}
