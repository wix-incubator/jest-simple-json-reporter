import S3rver from 's3rver'

export type TestContext = {
  s3: {
    s3BucketName: 'wix-ci-results'
    accessKeyId: 'S3RVER'
    secretAccessKey: 'S3RVER'
    s3Server: S3rver
    s3Address: string
    cleanupS3Storage: () => Promise<void>
  }
  sledVersion: string
  sledProjectLockFilePath: string
  bin: {
    tsNodePath: string
    jestPath: string
    testRetryPath: string
  }
}
