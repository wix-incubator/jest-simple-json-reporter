# Jest Simple Json Reporter

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
          reporters: ['default', 'jest-simple-json-reporter']
        },
   }
   ```

2. In `jest.config.js`

   ```typescript
   module.exports = {
    ...,
    reporters: ['default', 'jest-simple-json-reporter']
   }
   ```

---

### Options

- Note: env-variables have priority over custom-options.

1. Custom output path/name:

```bash
TEST_JSON_REPORTER_OUTPUT_PATH='./dir1/dir2/my-report-with-custom-name.json' jest
```

Or:

```typescript
// (dir1 and dir2 must exist!)
reporters: [
  'default',
  'jest-simple-json-reporter', { outputPath: './dir1/dir2/my-report-with-custom-name.json' }],
]
```

2. relative/abs paths in report-output:

by default, each test-file-path that is included in the report, will be relative path (based on cwd of where you run `jest`). if you want to change to absolute path:

- the relative-path will include `./` as prefix in each path. relative-path-result-example: `./__tests__/test1.spec.js`.
- symlinks in the absulote paths will be replaced with their real-path on your file-system.

```bash
TEST_JSON_REPORTER_USE_ABSOLUTE_PATHS=true jest
```

Or:

```typescript
// (dir1 and dir2 must exist!)
reporters: [
  'default',
  'jest-simple-json-reporter', { useAbsolutePaths: true }],
]
```

3. `KEEP_PATH_AS_IS=true` - specific when using with sled. sled provides to the reporter an invalid relative path to the test-file and I must save it as is.

---

Types:

```typescript
type JestSimpleJsonReporter = {
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
```

---

Notes:

1. if no tests are present in a file, then `file.passed === true`. (same as https://github.com/Hargne/jest-html-reporter)
2. if no tests at all for the project, jest won't notify any reporter about it so no report-file will be generated.

---

### Development

I'm using mono-repo strucutre to consume the reporter in the tests like the users will in production (I'm faking it using yarn workspaces)
