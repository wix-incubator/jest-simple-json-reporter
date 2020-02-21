export type JsonReporter = {
  passed: boolean
  filesResult: {
    passed: boolean
    path: string
    testResults: {
      didRun: boolean
      passed: boolean
      fullName: string
    }[]
  }[]
}
