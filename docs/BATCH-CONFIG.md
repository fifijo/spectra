# Batch Configuration JSON Structure

This document describes the JSON structure for batch scope execution.

## Schema

```json
{
  "url": "string (optional)",
  "scopes": [
    {
      "name": "string (optional)",
      "file": "string (optional)",
      "page": "string (optional)",
      "scope": "string (optional)",
      "description": "string (optional)"
    }
  ]
}
```

## Field Descriptions

### Root Level

#### `url` (optional)
- **Type**: `string`
- **Description**: Target application URL
- **Default**: Uses `--url` flag or `SPECTRA_URL` environment variable
- **Example**: `"http://localhost:5173"`

#### `scopes` (required)
- **Type**: `array`
- **Description**: Array of scope definitions to run sequentially
- **Example**: `[{...}, {...}]`

### Scope Object

#### `name` (optional)
- **Type**: `string`
- **Description**: Human-readable name for the scope (used for display/logging)
- **Example**: `"Login Form"`

#### `file` (optional)
- **Type**: `string`
- **Description**: Path to the scope file (relative to current directory or absolute)
- **Example**: `"SCOPE-login.md"` or `"./scopes/SCOPE-payment.md"`

#### `page` (optional)
- **Type**: `string`
- **Description**: Page the run is pointed at, e.g. `/checkout`
- **Example**: `"/login"`

#### `scope` (optional)
- **Type**: `string`
- **Description**: The single feature the run should test on that page
- **Example**: `"email and password validation"`

#### `description` (optional)
- **Type**: `string`
- **Description**: Description of what this scope tests. Ignored by the runner, kept for your notes.
- **Example**: `"Test user authentication flow"`

## Complete Example

```json
{
  "url": "http://localhost:5173",
  "scopes": [
    {
      "name": "Login Form",
      "file": "SCOPE-login.md",
      "page": "/login",
      "scope": "email and password validation",
      "description": "Test user authentication flow"
    },
    {
      "name": "Payment Form",
      "file": "SCOPE-payment.md",
      "page": "/checkout",
      "scope": "card payment form",
      "description": "Test credit card payment processing"
    },
    {
      "name": "Shipping Form",
      "file": "scopes/SCOPE-shipping.md",
      "page": "/checkout",
      "description": "Test shipping address form"
    },
    {
      "name": "Dashboard Analytics",
      "file": "/absolute/path/to/SCOPE-dashboard.md",
      "page": "/",
      "description": "Test analytics charts and widgets"
    }
  ]
}
```

## Minimal Example

Only `scopes` is required:

```json
{
  "scopes": [
    {
      "file": "SCOPE-login.md"
    },
    {
      "file": "SCOPE-payment.md"
    }
  ]
}
```

## Usage

```bash
# Run with batch config (URL from JSON)
npx spectra-test-automation --batch scopes-batch.json

# Run with batch config (override URL)
npx spectra-test-automation --url http://localhost:8080 --batch scopes-batch.json

# Narrow every scope of the batch
npx spectra-test-automation --batch scopes-batch.json --page /checkout --scope "payment form"
```

`--url`, `--page`, `--scope` and `--file` apply to every Scope in the batch.
When a Scope in the file sets the same field, the flag wins.

## Validation

The batch runner will:
- ✅ Validate JSON syntax
- ✅ Reject an unknown key, so a misspelled `scope` fails the run instead of widening it
- ✅ Check that `scopes` array exists and is not empty
- ✅ Exit if no URL is given (no `--url`, no `SPECTRA_URL`, no `url` in the config)
- ✅ Run each scope one after another
- ✅ Continue with the remaining scopes when one fails
- ✅ Report how many scopes failed at the end
- ✅ Keep the Plan and Healing Report of every scope under `.spectra/output/scopes/<number>-<name>/`

## Notes

- File paths are resolved relative to the current working directory
- Absolute paths are supported
- The `url` field in JSON is overridden by `--url` flag if provided
- The `name` and `description` fields are informational only and don't affect execution
- The `name` also names the folder that keeps the scope's results
