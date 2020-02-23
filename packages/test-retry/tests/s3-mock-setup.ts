/* eslint-disable new-cap */
/* eslint-disable no-undef */

import * as S3rver from 's3rver'
import { S3 } from 'aws-sdk'
import createFolderStrucutre from 'create-folder-structure'
import { TestInterface } from 'ava'
import { TestContext } from './types'

async function createS3Server(): Promise<{
  s3Address: string
  s3Server: S3rver
  cleanupS3Storage: () => Promise<void>
}> {
  const emptyTempFolder = await createFolderStrucutre({ content: {} })
  return new Promise((resolve, reject) => {
    const s3Server = new S3rver({
      port: 0,
      hostname: 'localhost',
      silent: true,
      directory: emptyTempFolder.entryPath,
      removeBucketsOnClose: true,
    }).run((err, { address = '', port = '' } = {}) => {
      if (err) {
        return reject(err)
      }
      return resolve({
        s3Address: `http://${address}:${port}`,
        s3Server,
        cleanupS3Storage: emptyTempFolder.cleanup,
      })
    })
  })
}

function createS3Bucket(options: {
  s3BucketName: string
  s3Address: string
  accessKeyId: string
  secretAccessKey: string
}): Promise<void> {
  const s3Client = new S3({
    accessKeyId: options.accessKeyId,
    secretAccessKey: options.secretAccessKey,
    endpoint: options.s3Address,
    s3ForcePathStyle: true,
  })

  return new Promise((resolve, reject) => {
    s3Client.createBucket(
      {
        Bucket: options.s3BucketName,
      },
      err => {
        if (err) {
          return reject(err)
        }
        return resolve()
      },
    )
  })
}

export function s3BeforeAfterEach(test: TestInterface<TestContext>) {
  test.beforeEach(async t => {
    t.timeout(100000)
    const s3BucketName = 'wix-ci-results'
    t.context.s3 = {
      ...(await createS3Server()),
      accessKeyId: 'S3RVER',
      secretAccessKey: 'S3RVER',
      s3BucketName,
    }
    await createS3Bucket({
      ...t.context.s3,
      s3BucketName,
    })
  })

  test.afterEach(async t => {
    await new Promise(resolve => t.context.s3.s3Server.close(resolve))
    await t.context.s3.cleanupS3Storage()
  })
}
