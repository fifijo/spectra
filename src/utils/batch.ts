/**
 * The Batch file: a list of Scope definitions, run one after another.
 *
 * Parsing and validating the file is pure — it never touches the file system and never exits.
 */

export interface ScopeDefinition {
  /** Human-readable name, used for the label and for the folder that keeps the results. */
  name?: string;
  /** Path of a file with detailed requirements. */
  file?: string;
  /** The page the run is pointed at. */
  page?: string;
  /** The single feature to test. */
  scope?: string;
  /** Notes for the reader of the file; ignored by the runner. */
  description?: string;
}

export interface Batch {
  /** The URL every Scope is pointed at, unless the run overrides it. */
  url?: string;
  scopes: ScopeDefinition[];
}

export type BatchParse = { ok: true; batch: Batch } | { ok: false; error: string };

const ROOT_KEYS = ['url', 'scopes'] as const;
const SCOPE_KEYS = ['name', 'file', 'page', 'scope', 'description'] as const;

function fail(error: string): BatchParse {
  return { ok: false, error };
}

/**
 * Parse and validate a Batch file.
 * A key that is not known is an error, not something to ignore: a misspelled "scope"
 * would otherwise widen the run to the whole page without saying so.
 */
export function parseBatchConfig(text: string): BatchParse {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail('not valid JSON');
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return fail('must be a JSON object');
  }
  const config = raw as Record<string, unknown>;

  const unknownRoot = Object.keys(config).filter((key) => !ROOT_KEYS.includes(key as never));
  if (unknownRoot.length > 0) {
    return fail(`unknown key(s): ${unknownRoot.join(', ')}. Known keys: ${ROOT_KEYS.join(', ')}`);
  }

  if (config.url !== undefined && typeof config.url !== 'string') {
    return fail('"url" must be a string');
  }

  if (!Array.isArray(config.scopes)) {
    return fail('must have a "scopes" array');
  }
  if (config.scopes.length === 0) {
    return fail('must have a non-empty "scopes" array');
  }

  const scopes: ScopeDefinition[] = [];
  for (const [index, entry] of config.scopes.entries()) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return fail(`scope ${index + 1} must be an object`);
    }
    const fields = entry as Record<string, unknown>;

    const unknown = Object.keys(fields).filter((key) => !SCOPE_KEYS.includes(key as never));
    if (unknown.length > 0) {
      return fail(
        `scope ${index + 1} has unknown key(s): ${unknown.join(', ')}. Known keys: ${SCOPE_KEYS.join(', ')}`,
      );
    }
    for (const key of SCOPE_KEYS) {
      const value = fields[key];
      if (value !== undefined && typeof value !== 'string') {
        return fail(`scope ${index + 1} "${key}" must be a string`);
      }
    }

    scopes.push({
      name: fields.name as string | undefined,
      file: fields.file as string | undefined,
      page: fields.page as string | undefined,
      scope: fields.scope as string | undefined,
      description: fields.description as string | undefined,
    });
  }

  return { ok: true, batch: { url: config.url as string | undefined, scopes } };
}
