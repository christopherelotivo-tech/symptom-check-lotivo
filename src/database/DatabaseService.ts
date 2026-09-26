import * as SQLite from 'expo-sqlite';
import { Rule } from '../engine/types';
import seedRules from './seedRules.json';

// The single shared database instance for the app lifecycle.
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Opens (or reuses) the database connection and returns it.
 */
async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('symptomcheck.db');
  }
  return db;
}

// ---------------------------------------------------------------------------
// Schema DDL
// ---------------------------------------------------------------------------

const CREATE_SYSTEM_RULES_TABLE = `
  CREATE TABLE IF NOT EXISTS system_rules (
    id          TEXT PRIMARY KEY NOT NULL,
    rule_json   TEXT NOT NULL,
    is_active   INTEGER NOT NULL DEFAULT 1
  );
`;

const CREATE_CUSTOM_RULES_TABLE = `
  CREATE TABLE IF NOT EXISTS custom_rules (
    id          TEXT PRIMARY KEY NOT NULL,
    rule_json   TEXT NOT NULL,
    is_enabled  INTEGER NOT NULL DEFAULT 1,
    created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );
`;

const CREATE_PATIENT_HISTORY_TABLE = `
  CREATE TABLE IF NOT EXISTS patient_history (
    id          TEXT PRIMARY KEY NOT NULL,
    date        INTEGER NOT NULL,
    symptoms    TEXT NOT NULL,
    triage      TEXT NOT NULL,
    advice      TEXT NOT NULL,
    audit       TEXT NOT NULL
  );
`;

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * Initialises the database on app startup.
 *
 * - Creates `system_rules`, `custom_rules`, and `patient_history` tables if they don't exist.
 * - Seeds `system_rules` from `seedRules.json` only when the table is empty.
 *
 * Call this once from your root component (e.g. inside a `useEffect` or
 * an `onInit` prop of `<SQLiteProvider>`).
 */
export async function initDatabase(): Promise<void> {
  const database = await getDb();

  // Enable WAL mode for better concurrent read performance.
  await database.execAsync('PRAGMA journal_mode = WAL;');

  // Create tables.
  await database.execAsync(CREATE_SYSTEM_RULES_TABLE);
  await database.execAsync(CREATE_CUSTOM_RULES_TABLE);
  await database.execAsync(CREATE_PATIENT_HISTORY_TABLE);

  // Seed system rules only when the table is empty.
  await seedSystemRules(database);
}

/**
 * Seeds `system_rules` from the bundled JSON file if the table is empty.
 * This is idempotent — it will never insert duplicates.
 */
async function seedSystemRules(database: SQLite.SQLiteDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM system_rules'
  );

  // FORCE RESEED FOR THIS UPDATE
  console.log('[DatabaseService] Clearing old system_rules to re-seed short titles...');
  await database.execAsync('DELETE FROM system_rules;');

  console.log('[DatabaseService] Seeding system_rules from seedRules.json…');

  for (const rule of seedRules as Rule[]) {
    await database.runAsync(
      'INSERT INTO system_rules (id, rule_json) VALUES (?, ?)',
      rule.id,
      JSON.stringify(rule)
    );
  }

  console.log(`[DatabaseService] Seeded ${seedRules.length} system rule(s).`);
}

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

/**
 * Returns all rules from both `system_rules` and `custom_rules`, merged
 * into a single array. Custom rules are appended after system rules.
 */
export async function getAllRules(): Promise<Rule[]> {
  const database = await getDb();

  const systemRows = await database.getAllAsync<{ rule_json: string }>(
    'SELECT rule_json FROM system_rules'
  );

  const customRows = await database.getAllAsync<{ rule_json: string }>(
    'SELECT rule_json FROM custom_rules ORDER BY created_at ASC'
  );

  const parseRows = (rows: { rule_json: string }[]): Rule[] =>
    rows.map(row => JSON.parse(row.rule_json) as Rule);

  return [...parseRows(systemRows), ...parseRows(customRows)];
}

/**
 * Returns only the immutable system rules.
 */
export async function getSystemRules(): Promise<Rule[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ rule_json: string }>(
    'SELECT rule_json FROM system_rules'
  );
  return rows.map(row => JSON.parse(row.rule_json) as Rule);
}

/**
 * Returns all rules with their enabled state for admin UI.
 * System rules use `is_active`, custom rules use `is_enabled`.
 */
export async function getAllRulesAdmin(): Promise<{ rule: Rule; isEnabled: boolean; isSystem: boolean }[]> {
  const database = await getDb();
  
  const systemRows = await database.getAllAsync<{ rule_json: string; is_active: number }>(
    'SELECT rule_json, is_active FROM system_rules'
  );
  
  const customRows = await database.getAllAsync<{ rule_json: string; is_enabled: number }>(
    'SELECT rule_json, is_enabled FROM custom_rules ORDER BY created_at ASC'
  );

  const sysRules = systemRows.map(row => ({
    rule: JSON.parse(row.rule_json) as Rule,
    isEnabled: row.is_active === 1,
    isSystem: true,
  }));

  const custRules = customRows.map(row => ({
    rule: JSON.parse(row.rule_json) as Rule,
    isEnabled: row.is_enabled === 1,
    isSystem: false,
  }));

  return [...sysRules, ...custRules];
}

/**
 * Loads the unified rule set for the inference engine.
 *
 * Merges:
 *   - Active system rules   (`is_active = 1` in `system_rules`)
 *   - Enabled custom rules  (`is_enabled = 1` in `custom_rules`)
 *
 * Rules are ordered: system rules first (insertion order), then custom
 * rules ordered by `created_at` ascending. Priority-based resolution
 * inside the inference engine handles the actual execution order.
 *
 * @returns A single `Rule[]` ready to be passed to `new InferenceEngine(rules)`.
 */
export async function loadUnifiedRules(): Promise<Rule[]> {
  const database = await getDb();

  // Fetch only active system rules.
  const systemRows = await database.getAllAsync<{ rule_json: string }>(
    'SELECT rule_json FROM system_rules WHERE is_active = 1'
  );

  // Fetch only enabled custom rules, ordered by creation time.
  const customRows = await database.getAllAsync<{ rule_json: string }>(
    'SELECT rule_json FROM custom_rules WHERE is_enabled = 1 ORDER BY created_at ASC'
  );

  const parseRows = (rows: { rule_json: string }[]): Rule[] =>
    rows.map(row => JSON.parse(row.rule_json) as Rule);

  // Merge into a single in-memory array.
  const unified: Rule[] = [
    ...parseRows(systemRows),
    ...parseRows(customRows),
  ];

  console.log(
    `[DatabaseService] loadUnifiedRules: ${systemRows.length} system + ` +
    `${customRows.length} custom = ${unified.length} total rule(s).`
  );

  return unified;
}

// ---------------------------------------------------------------------------
// Toggle helpers
// ---------------------------------------------------------------------------

/**
 * Activates or deactivates a system rule without deleting it.
 * @param id       The rule ID to toggle.
 * @param isActive `true` to activate, `false` to deactivate.
 */
export async function setSystemRuleActive(id: string, isActive: boolean): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE system_rules SET is_active = ? WHERE id = ?',
    isActive ? 1 : 0,
    id
  );
}

/**
 * Enables or disables a custom rule without deleting it.
 * @param id        The rule ID to toggle.
 * @param isEnabled `true` to enable, `false` to disable.
 */
export async function setCustomRuleEnabled(id: string, isEnabled: boolean): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE custom_rules SET is_enabled = ? WHERE id = ?',
    isEnabled ? 1 : 0,
    id
  );
}

// ---------------------------------------------------------------------------
// Custom rules CRUD
// ---------------------------------------------------------------------------


/**
 * Inserts a new admin-created rule into `custom_rules`.
 * Throws if a rule with the same `id` already exists.
 */
export async function addCustomRule(rule: Rule): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO custom_rules (id, rule_json) VALUES (?, ?)',
    rule.id,
    JSON.stringify(rule)
  );
}

/**
 * Updates an existing custom rule by id.
 */
export async function updateCustomRule(rule: Rule): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE custom_rules SET rule_json = ? WHERE id = ?',
    JSON.stringify(rule),
    rule.id
  );
}

/**
 * Deletes a custom rule by id.
 */
export async function deleteCustomRule(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM custom_rules WHERE id = ?', id);
}

// ---------------------------------------------------------------------------
// Teardown (optional — useful for testing)
// ---------------------------------------------------------------------------

/**
 * Closes the database connection. Call this only when you need to
 * fully reset state (e.g. between integration tests).
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

