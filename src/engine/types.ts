/**
 * WorkingMemory represents the current state of known facts.
 * It stores whether a fact is present, and its mathematical severity weight (0.0 to 1.0).
 */
export type WorkingMemory = Record<string, { value: boolean; weight: number }>;

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
  triageAdvice: string; // General/Fallback advice
  selfCareAdvice?: string;
  medicationAdvice?: string;
  escalationTrigger?: string;
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

export type AuditEntryType = 'USER_INPUT' | 'RULE_FIRED' | 'FACT_DERIVED' | 'AGGREGATE_SEVERITY_OVERRIDE';

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
 * Tracks when the system overrides the risk level because the total weight of symptoms was too high.
 */
export interface AggregateSeverityAuditEntry extends BaseAuditEntry {
  type: 'AGGREGATE_SEVERITY_OVERRIDE';
  aggregateScore: number;
  thresholdCrossed: number;
  newRiskCategory: 'Green' | 'Amber' | 'Red';
}

/**
 * An entry in the evaluation engine's audit trail.
 */
export type AuditTrailEntry =
  | UserInputAuditEntry
  | RuleFiredAuditEntry
  | FactDerivedAuditEntry
  | AggregateSeverityAuditEntry;

// --- UI Output Structures ---

/**
 * The structured result of a full inference engine evaluation pass.
 * Derived by the parent screen from the engine's audit trail and the
 * highest-priority fired rule — ready for direct consumption by TriageCard.
 */
export interface TriageResult {
  /** The highest-priority risk level raised during this evaluation. */
  riskCategory: 'Green' | 'Amber' | 'Red';
  /** Primary clinical advice to display to the user. */
  triageAdvice: string;
  selfCareAdvice?: string;
  medicationAdvice?: string;
  escalationTrigger?: string;
  /** Human-readable description of the triggered condition. */
  description: string;
  /** Ordered list of rule IDs that fired, for audit display. */
  firedRuleIds: string[];
}
