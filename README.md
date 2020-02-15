# Jest Simple Json Reporter

Write the tests results as jest provides to a file. No transformations.

---

```bash
yarn add --dev jest-simple-json-reporter
```

---

### How to use

Both examples will generate `jest-simple-json-reporter-results.json` next to `package.json`.

- "default" reporter is the cli outout reporter. with out it, you wont see nothing on the console when running jest locally.

1. In `package.json`

   ```typescript
   {
     jest: {
          ...,
          reporters: ["default", require.resolve('jest-simple-json-reporter')]
        },
   }
   ```

2. In `jest.config.js`

   ```typescript
   module.exports = {
    ...,
    reporters: ["default", require.resolve('jest-simple-json-reporter')]
   }
   ```

---

Custom output path/name:

```typescript
// (dir1 and dir2 must exist!)
reporters: [
  'default',
  [require.resolve('jest-simple-json-reporter'), { outputPath: './dir1/dir2/my-report-with-custom-name.json' }],
]
```

---

Use can the output as (verified on jest@24.x):

```typescript
const resultsSummary = {
  startTime: results.startTime,
  wasInterrupted: results.wasInterrupted,
  filesStatus: results.testResults.map(fileResult => {
    return {
      success: fileResult.numFailingTests > 0,
      failureMessage: fileResult.failureMessage,
      path: fileResult.testFilePath,
      skipped: fileResult.skipped,
      leaks: fileResult.leaks,
      testResults: fileResult.testResults.map(testResult => {
        return {
          duration: testResult.duration,
          didRun: testResult.status === 'failed' || testResult.status === 'passed',
          success: testResult.status === 'failed',
          fullName: testResult.fullName,
          failureMessages: testResult.failureMessages,
        }
      }),
    }
  }),
}
```

---

### Development

I'm using mono-repo strucutre to consume the reporter in the tests like the users will in production (I'm faking it using yarn workspaces)
