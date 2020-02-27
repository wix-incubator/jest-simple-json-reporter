export type JsonReporter = {
  passed: boolean
  filesResult: FileResult[]
}

export type FileResult = {
  passed: boolean
  path: string
  testResults: TestResult[]
}

export type TestResult = {
  didRun: boolean
  passed: boolean
  fullName: string
}
