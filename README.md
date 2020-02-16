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

Custom output path/name:

```typescript
// (dir1 and dir2 must exist!)
reporters: [
  'default',
  'jest-simple-json-reporter', { outputPath: './dir1/dir2/my-report-with-custom-name.json' }],
]
```

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
