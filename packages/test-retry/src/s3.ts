import * as aws from 'aws-sdk'

function getAWSCredentials() {
  return !process.env.NPM_CI_AWS_ACCESS_KEY || !process.env.NPM_CI_AWS_SECRET_ACCESS_KEY
    ? new aws.SharedIniFileCredentials({
        profile: process.env.NPM_CI_AWS_CREDENTIALS_PROFILE || 'cache-aws',
      })
    : new aws.Credentials(process.env.NPM_CI_AWS_ACCESS_KEY, process.env.NPM_CI_AWS_SECRET_ACCESS_KEY)
}

export async function saveToS3({ bucket, key, value }: { bucket: string; key: string; value: string }): Promise<void> {
  const s3Client = new aws.S3({
    credentials: getAWSCredentials(),
    ...(process.env.NPM_CI_AWS_S3_ADDRESS && {
      endpoint: process.env.NPM_CI_AWS_S3_ADDRESS,
      s3ForcePathStyle: true,
    }),
  })

  const currentDate = new Date()
  currentDate.setMonth(currentDate.getMonth() + 1)
  const expiredDate = currentDate

  await new Promise<void>((resolve, reject) => {
    s3Client.upload(
      {
        Body: value,
        Bucket: bucket,
        Key: key,
        Expires: expiredDate,
      },
      (err: Error) => {
        if (err) {
          return reject(err)
        }
        return resolve()
      },
    )
  })
}

export async function hasKeyInS3({ bucket, key }: { bucket: string; key: string }): Promise<boolean> {
  const s3Client = new aws.S3({
    credentials: getAWSCredentials(),
    ...(process.env.NPM_CI_AWS_S3_ADDRESS && {
      endpoint: process.env.NPM_CI_AWS_S3_ADDRESS,
      s3ForcePathStyle: true,
    }),
  })

  return s3Client
    .headObject({
      Bucket: bucket,
      Key: key,
    })
    .promise()
    .then(
      () => Promise.resolve(true),
      e => {
        if (e.code === 'NotFound') {
          return false
        }
        throw e
      },
    )
}

export async function readFromS3<Result>({
  bucket,
  key,
  mapper,
}: {
  bucket: string
  key: string
  mapper: (value: string) => Result
}): Promise<Result> {
  const s3Client = new aws.S3({
    credentials: getAWSCredentials(),
    ...(process.env.NPM_CI_AWS_S3_ADDRESS && {
      endpoint: process.env.NPM_CI_AWS_S3_ADDRESS,
      s3ForcePathStyle: true,
    }),
  })

  return new Promise((resolve, reject) => {
    s3Client.getObject(
      {
        Bucket: bucket,
        Key: key,
      },
      (err, data) => {
        if (err) {
          return reject(err)
        }
        const result = data.Body?.toString()
        if (result === undefined) {
          return reject('return value from s3 is undefined. looks like a bug')
        }
        return resolve(mapper(result))
      },
    )
  })
}
