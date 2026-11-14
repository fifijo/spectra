# Spectra Scope Definition

Use this file to define exactly what you want to test.
Copy to `SCOPE.md` and customize.

---

## Target Feature

**Feature Name**: [e.g., Payment Form]

**Description**:
[Describe the specific feature]

---

## Location

**Page URL**: [e.g., /checkout]
**Section**: [Which part of the page]

This is the page the run is pointed at. A `--page` flag overrides it. Leave the
placeholder as it is and the run covers the whole application.

---

## Test Focus (choose what to prioritize)

- [ ] Happy path only
- [ ] Validation and error cases
- [ ] Empty state handling
- [ ] Loading and async states
- [ ] Toggle/interaction states
- [ ] Edge cases and boundary values

---

## Elements to Test

- [ ] Element 1
- [ ] Element 2
- [ ] Element 3

---

## User Flows

### Flow 1: Happy Path
1. Step 1
2. Step 2
3. Expected result

### Flow 2: Error Case
1. Step 1
2. Expected error

---

## Out of Scope

DO NOT test these (even if on same page):
- Feature A
- Feature B

These are passed to the agents as "Elements to Ignore".

---

## Test Data

```
Valid input: xxx
Invalid input: yyy
```
