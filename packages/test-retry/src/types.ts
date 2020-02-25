// any test reporter (jest,jasmine,...) must provide this API.
export type TestJsonReporter = {
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

export enum TestRunner {
  jest = 'jest',
  sled = 'sled',
}

export type Options = {
  skipAndRunUserCommand: boolean
  cwd: string
  userTestCommand: string
  srcMd5: string
  s3BucketNameForTestsReports: string
  reportPath: string
  testRunner: TestRunner
}

export type S3Options = { bucket: string; key: string }
