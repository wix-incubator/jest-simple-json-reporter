export enum TestRunner {
  jest = 'jest',
  sledLocal = 'sled-local',
  sledRemote = 'sled-remote',
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
