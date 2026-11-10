---
'spectra-test-automation': patch
---

Make the agents' instructions and the docs agree with each other.

- The Generator template now uses only `getByRole`, `getByLabel`,
  `getByTestId` and `getByText`. It taught CSS selectors in twelve samples
  and told the Generator never to use them, so the reviewer sent every one
  of them back.
- The samples in the Generator template now assert what the user can see,
  and the gate lists the twelve patterns a reviewer has to check.
- The Healer template says that the healing report and the status file are
  required, also when every test passed. A run that skipped them stopped at
  the Healer.
- The README, the quick reference, the e2e skill and the gate carry the same
  eight tags, and name `@blocked` and `@flaky` as the two triage tags the
  Generator never emits.
- The CI/Healer policy names the numbers the code uses: the artifacts the
  workflow uploads and when, three attempts per test, and the Playwright
  timeout of 30 seconds.
- The README no longer calls the manual mode "manual Cursor mode".
