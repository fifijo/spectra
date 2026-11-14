---
'spectra-test-automation': minor
---

Read the page and the exclusions from the scope file.

- A `**Page URL**: /path` line in the scope file now points the run at that
  page. A `--page` flag still wins, and a placeholder the user never filled in
  is ignored, so a copied template does not send the run to `/path`.
- The `## Out of Scope` section is lifted out of the pasted requirements and
  handed to the Agents as `## Elements to Ignore`, which is what the Planner
  template asks for.
