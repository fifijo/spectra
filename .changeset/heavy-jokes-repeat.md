---
'spectra-test-automation': patch
---

Fix the runs that failed for the wrong reason.

- The completion check compares the content of a file, not only its time. The
  clock of the file system is coarse, so an Agent that rewrote a file in the
  same tick as the start of the run was reported as writing nothing.
- The CI workflow we ship runs on `ubuntu-24.04`: Playwright 1.59 has no
  browser build for `ubuntu-26.04`, so the job died before the first test.
- The gate docs in `specs/` ship with the package again, so `--init` puts them
  in a new project.
