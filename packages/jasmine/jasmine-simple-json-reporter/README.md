# Jasmine Simple Json Reporter

---

```bash
yarn add --dev jasmine-simple-json-reporter
```

---

### How to use

Both examples will generate `jasmine-simple-json-reporter-results.json` next to `package.json`.

- "default" reporter is the cli outout reporter. with out it, you wont see nothing on the console when running jest locally.


```javascript
// jasmine.js

const Jasmine = require('jasmine');
const jasmine = new Jasmine();
jasmine.loadConfig({
    spec_dir: 'spec',
    spec_files: ['**/*.spec.js'],
});
const JasmineConsoleReporter = require("$jasmine-console-reporter");
jasmine.addReporter(new JasmineConsoleReporter());
jasmine.addReporter(require("jasmine-simple-json-reporter")());
jasmine.execute();
```

then, run jasmine.js from command like: `node jasmine.js`.

---

### Options

- Note: env-variables have priority over custom-options.

1. Custom output path/name:

```bash
TEST_JSON_REPORTER_OUTPUT_PATH='./dir1/dir2/my-report-with-custom-name.json' node jasmine.js
```

Or:

```javascript
// jasmine.js

const Jasmine = require('jasmine');
const jasmine = new Jasmine();
jasmine.loadConfig({
    spec_dir: 'spec',
    spec_files: ['**/*.spec.js'],
});
const JasmineConsoleReporter = require("$jasmine-console-reporter");
jasmine.addReporter(new JasmineConsoleReporter());
jasmine.addReporter(require("jasmine-simple-json-reporter")({outputPath: './dir1/dir2/my-report-with-custom-name.json' }));
jasmine.execute();
```

---

Types:

```typescript
type JestSimpleJsonReporter = {
  passed: boolean
  filesResult: {
    passed: boolean
    path: 'not specified' // jasmine doesn't provide this info
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

1. jasmine doesn't provide much info in the report: test-file-path.
so we can't for each test, what is the path to it's test-file so as a workaround, I created a `fileResult` object for each test (each `fileResult` object will have a single test).

---

### Development

I'm using mono-repo strucutre to consume the reporter in the tests like the users will in production (I'm faking it using yarn workspaces)
