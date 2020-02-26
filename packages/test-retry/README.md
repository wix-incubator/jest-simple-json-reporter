# Test Retry

Run only failed tests in any-ci from last build.

```bash
test-retry --test-runner jest -- jest
```

In remote run, `test-retry` will change the user-command to:

```bash
test-retry --test-runner jest -- jest -t "<failed-tests-names-regex>"
```

In local runs, `test-retry` will simply run the user-command (after `--`). in this case, it will be: `jest`.

---

```bash
yarn add --dev test-retry
```

---

### Supported Test-Runners

1. Jest
2. Sled [Wix-only]
3. Jasmine - Work In Progress

-----------

### How to use

#### Jest

1. Install & use [`jest-simple-json-reporter`](https://github.com/wix-incubator/jest-simple-json-reporter/tree/master/packages/jest/jest-simple-json-reporter)

2. run `test-retry --test-runner jest -- jest`

#### Sled

1. Install & use [`jest-simple-json-reporter`](https://github.com/wix-incubator/jest-simple-json-reporter/tree/master/packages/jest/jest-simple-json-reporter)

2. run `test-retry --test-runner sled -- sled <sled-flags>`

-------------------

### CLI Options

|| required | default-value | options | example | docs |
| ---------------- | ----------| --------| ---------| -------| --- |
|`--test-runner`| true |  | `jest`,`sled` | `--test-runner jest` | which test runner will appear in the user-command |
|`--enabled`| false | true in CI | `true`,`false` | `--enabled true` | false = run only user command. true = enable retry-feature in CI for failed tests |
