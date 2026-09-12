/**
 * DatabaseService.test.ts
 *
 * expo-sqlite is a native module and cannot run in a Node/Jest environment.
 * We use a manual mock (src/__mocks__/expo-sqlite.ts) mapped via jest.config.js
 * moduleNameMapper so Jest never loads the real ESM file.
 *
 * The singleton `db` inside DatabaseService is reset between tests by
 * calling closeDatabase(), which sets it back to null so the next call
 * to any service function invokes openDatabaseAsync again — returning our
 * freshly-configured mock database.
 */

import * as SQLite from 'expo-sqlite';
import seedRules from '../seedRules.json';
import { Rule } from '../../engine/types';

// ---------------------------------------------------------------------------
// In-memory stores (shared by mock and test assertions)
// ---------------------------------------------------------------------------

let systemRulesStore: Array<{
  id: string;
  rule_json: string;
  is_active: number;
}> = [];

let customRulesStore: Array<{
  id: string;
  rule_json: string;
  is_enabled: number;
  created_at: number;
}> = [];

// ---------------------------------------------------------------------------
// Mock db factory
// ---------------------------------------------------------------------------

function createMockDb() {
  return {
    execAsync: jest.fn().mockResolvedValue(undefined),

    getFirstAsync: jest.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('COUNT') && sql.includes('system_rules')) {
        return { count: systemRulesStore.length };
      }
      return null;
    }),

    getAllAsync: jest.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('system_rules') && sql.includes('is_active = 1')) {
        return systemRulesStore
          .filter(r => r.is_active === 1)
          .map(r => ({ rule_json: r.rule_json }));
      }
      if (sql.includes('system_rules')) {
        return systemRulesStore.map(r => ({ rule_json: r.rule_json }));
      }
      if (sql.includes('custom_rules') && sql.includes('is_enabled = 1')) {
        return customRulesStore
          .filter(r => r.is_enabled === 1)
          .map(r => ({ rule_json: r.rule_json }));
      }
      if (sql.includes('custom_rules')) {
        return customRulesStore.map(r => ({ rule_json: r.rule_json }));
      }
      return [];
    }),

    runAsync: jest.fn().mockImplementation(async (sql: string, ...args: unknown[]) => {
      if (sql.includes('INSERT INTO custom_rules')) {
        customRulesStore.push({
          id: args[0] as string,
          rule_json: args[1] as string,
          is_enabled: 1,
          created_at: Date.now(),
        });
      }
      return { lastInsertRowId: 0, changes: 1 };
    }),

    prepareAsync: jest.fn().mockImplementation(async (sql: string) => ({
      executeAsync: jest.fn().mockImplementation(async (params: Record<string, unknown>) => {
        if (sql.includes('INSERT INTO system_rules')) {
          systemRulesStore.push({
            id: params.$id as string,
            rule_json: params.$rule_json as string,
            is_active: 1,
          });
        }
        return { lastInsertRowId: 0, changes: 1 };
      }),
      finalizeAsync: jest.fn().mockResolvedValue(undefined),
    })),

    closeAsync: jest.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------
// Test lifecycle
// ---------------------------------------------------------------------------

// Import the service once at the top — jest.resetModules() is NOT used here.
// Instead, closeDatabase() resets the module-level singleton so the next
// call to any service function calls openDatabaseAsync again.
import {
  initDatabase,
  loadUnifiedRules,
  addCustomRule,
  closeDatabase,
} from '../DatabaseService';

beforeEach(async () => {
  // 1. Wipe the in-memory stores.
  systemRulesStore = [];
  customRulesStore = [];

  // 2. Return a fresh mock db on the next openDatabaseAsync call.
  (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(createMockDb());

  // 3. Reset the singleton inside DatabaseService so it calls openDatabaseAsync again.
  await closeDatabase();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DatabaseService', () => {

  // ── initDatabase() ──────────────────────────────────────────────────────

  describe('initDatabase()', () => {

    it('creates the system_rules table', async () => {
      await initDatabase();

      const mockDb = await (SQLite.openDatabaseAsync as jest.Mock).mock.results[0].value;
      const ddlCalls: string[] = (mockDb.execAsync as jest.Mock).mock.calls.map(
        (call: unknown[]) => call[0] as string
      );

      expect(ddlCalls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS system_rules'))).toBe(true);
    });

    it('creates the custom_rules table', async () => {
      await initDatabase();

      const mockDb = await (SQLite.openDatabaseAsync as jest.Mock).mock.results[0].value;
      const ddlCalls: string[] = (mockDb.execAsync as jest.Mock).mock.calls.map(
        (call: unknown[]) => call[0] as string
      );

      expect(ddlCalls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS custom_rules'))).toBe(true);
    });

    it('seeds system_rules from seedRules.json on first run', async () => {
      await initDatabase();

      expect(systemRulesStore).toHaveLength(seedRules.length);
    });

    it('stores each seed rule with the correct id', async () => {
      await initDatabase();

      const storedIds = systemRulesStore.map(r => r.id);
      const seedIds   = (seedRules as Rule[]).map(r => r.id);

      expect(storedIds).toEqual(expect.arrayContaining(seedIds));
    });

    it('does NOT re-seed when system_rules already has rows', async () => {
      // Pre-seed one row to simulate a prior launch.
      systemRulesStore.push({
        id: 'EXISTING',
        rule_json: JSON.stringify(seedRules[0]),
        is_active: 1,
      });

      await initDatabase();

      // Must still be exactly 1 row — no duplicates.
      expect(systemRulesStore).toHaveLength(1);
    });

  });

  // ── loadUnifiedRules() ───────────────────────────────────────────────────

  describe('loadUnifiedRules()', () => {

    it('returns all active system rules', async () => {
      await initDatabase();
      const rules = await loadUnifiedRules();

      expect(rules).toHaveLength(seedRules.length);
    });

    it('excludes inactive system rules', async () => {
      await initDatabase();
      systemRulesStore[0].is_active = 0;

      const rules = await loadUnifiedRules();

      expect(rules).toHaveLength(seedRules.length - 1);
    });

    it('merges enabled custom rules after system rules', async () => {
      await initDatabase();

      const customRule: Rule = {
        id: 'CUSTOM_001',
        antecedents: [{ fact: 'rash', operator: 'EQUALS', value: true }],
        consequent: { fact: 'possible_allergy', value: true },
        metadata: {
          priority: 30,
          riskCategory: 'Amber',
          triageAdvice: 'Consult a doctor if rash spreads.',
          description: 'Detects possible allergic reaction.',
        },
      };

      await addCustomRule(customRule);

      const rules = await loadUnifiedRules();

      expect(rules).toHaveLength(seedRules.length + 1);
      // Custom rule appears last.
      expect(rules[rules.length - 1].id).toBe('CUSTOM_001');
    });

    it('excludes disabled custom rules', async () => {
      await initDatabase();

      const customRule: Rule = {
        id: 'CUSTOM_002',
        antecedents: [{ fact: 'nausea', operator: 'EQUALS', value: true }],
        consequent: { fact: 'possible_gi_issue', value: true },
        metadata: {
          priority: 25,
          riskCategory: 'Green',
          triageAdvice: 'Stay hydrated.',
          description: 'Detects possible GI issue.',
        },
      };

      await addCustomRule(customRule);
      // Disable it directly in the store.
      customRulesStore[0].is_enabled = 0;

      const rules = await loadUnifiedRules();

      expect(rules).toHaveLength(seedRules.length);
      expect(rules.find(r => r.id === 'CUSTOM_002')).toBeUndefined();
    });

    it('returns a unified array where each item is a valid Rule', async () => {
      await initDatabase();
      const rules = await loadUnifiedRules();

      rules.forEach(rule => {
        expect(typeof rule.id).toBe('string');
        expect(Array.isArray(rule.antecedents)).toBe(true);
        expect(typeof rule.consequent.fact).toBe('string');
        expect(typeof rule.metadata.priority).toBe('number');
        expect(['Green', 'Amber', 'Red']).toContain(rule.metadata.riskCategory);
      });
    });

  });
});

