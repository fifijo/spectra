# Batch Configuration JSON Structure

This document describes the JSON structure for batch scope execution.

## Schema

```json
{
  "url": "string (optional)",
  "scopes": [
    {
      "name": "string (optional)",
      "file": "string (required)",
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

#### `file` (required)
- **Type**: `string`
- **Description**: Path to the scope file (relative to current directory or absolute)
- **Example**: `"SCOPE-login.md"` or `"./scopes/SCOPE-payment.md"`

#### `description` (optional)
- **Type**: `string`
- **Description**: Description of what this scope tests (for documentation)
- **Example**: `"Test user authentication flow"`

## Complete Example

```json
{
  "url": "http://localhost:5173",
  "scopes": [
    {
      "name": "Login Form",
      "file": "SCOPE-login.md",
      "description": "Test user authentication flow"
    },
    {
      "name": "Payment Form",
      "file": "SCOPE-payment.md",
      "description": "Test credit card payment processing"
    },
    {
      "name": "Shipping Form",
      "file": "scopes/SCOPE-shipping.md",
      "description": "Test shipping address form"
    },
    {
      "name": "Dashboard Analytics",
      "file": "/absolute/path/to/SCOPE-dashboard.md",
      "description": "Test analytics charts and widgets"
    }
  ]
}
```

## Minimal Example

Only the `file` field is required:

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
./spectra --batch scopes-batch.json

# Run with batch config (override URL)
./spectra --url http://localhost:8080 --batch scopes-batch.json
```

## Validation

The batch runner will:
- ✅ Validate JSON syntax
- ✅ Check that `scopes` array exists
- ✅ Verify each scope file exists
- ⚠️ Warn if a file is missing (continues with remaining scopes)
- ❌ Exit if no valid scope files found

## Notes

- File paths are resolved relative to the current working directory
- Absolute paths are supported
- The `url` field in JSON is overridden by `--url` flag if provided
- The `name` and `description` fields are informational only and don't affect execution
