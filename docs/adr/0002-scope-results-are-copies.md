# A Scope's results are copied, not moved into a namespace of their own

Every Scope in a Batch writes its Plan and Healing Report to the same canonical paths, so the next Scope overwrites them — a batch of three scopes used to leave only the last one's results behind. The fix copies what each Agent produced into `.spectra/output/scopes/<number>-<name>/` right after that Agent finishes.

The alternative was to give each Scope its own output dir and let the Agents write into it. We did not, because the Agents do not own every path they touch: the Playwright config writes `reports/results.json` into the output dir, and a user's own config may write more, so the output dir cannot move without the user changing their config too. It would also have forced every template to stop naming its paths, which is a much larger change than the bug needed.

The cost of this choice: the canonical path still holds the *last* Scope's results, and the per-Scope folders are copies rather than the originals. `reports/results.json` is not copied, so a Scope's raw test results are lost — its Healing Report and `status.json` carry the summary instead.
