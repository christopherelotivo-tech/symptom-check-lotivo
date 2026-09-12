/**
 * WorkingMemory represents the current state of known facts.
 * For this symptom evaluation system, facts are boolean flags (e.g., 'has_fever': true).
 */
export type WorkingMemory = Record<string, boolean>;

/**
 * Represents an operator used to evaluate a fact against a value.
 */
export type Operator = 'EQUALS' | 'NOT_EQUALS';

/**
 * A single condition that must be met for a rule to fire.
 */
export interface RuleCondition {
  fact: string;
  operator: Operator;
  value: boolean;
}

/**
 * The resulting outcome when a rule fires.
 */
export interface RuleConsequent {
  fact: string;
  value: boolean;
}

/**
 * Metadata providing clinical or operational context for a rule.
 */
export interface RuleMetadata {
  priority: number;
  riskCategory: 'Green' | 'Amber' | 'Red';
  triageAdvice: string;
  description: string;
}

/**
 * A rule within the Knowledge-Based System.
 */
export interface Rule {
  id: string;
  antecedents: RuleCondition[];
  consequent: RuleConsequent;
  metadata: RuleMetadata;
}

// --- Audit Trail Structures ---

export type AuditEntryType = 'USER_INPUT' | 'RULE_FIRED' | 'FACT_DERIVED';

export interface BaseAuditEntry {
  id: string;
  timestamp: number;
  type: AuditEntryType;
}

/**
 * Tracks a fact explicitly provided by the user.
 */
export interface UserInputAuditEntry extends BaseAuditEntry {
  type: 'USER_INPUT';
  fact: string;
  value: boolean;
}

/**
 * Tracks when a rule successfully evaluates to true.
 */
export interface RuleFiredAuditEntry extends BaseAuditEntry {
  type: 'RULE_FIRED';
  ruleId: string;
}

/**
 * Tracks a new fact inferred by the system as a result of a rule firing.
 */
export interface FactDerivedAuditEntry extends BaseAuditEntry {
  type: 'FACT_DERIVED';
  fact: string;
  value: boolean;
  sourceRuleId: string;
}

/**
 * An entry in the evaluation engine's audit trail.
 */
export type AuditTrailEntry =
  | UserInputAuditEntry
  | RuleFiredAuditEntry
  | FactDerivedAuditEntry;

