import {
  Rule,
  WorkingMemory,
  AuditTrailEntry,
  RuleCondition
} from './types';

export class InferenceEngine {
  private rules: Rule[];

  constructor(rules: Rule[]) {
    this.rules = rules;
  }

  /**
   * Evaluates the rules against the provided working memory.
   * Executes a data-driven Forward-Chaining (Match-Resolve-Act) loop.
   * 
   * @param initialMemory The starting facts (usually populated by user input).
   * @param initialAuditTrail The existing audit trail (containing USER_INPUT events).
   * @returns The resulting working memory and updated audit trail.
   */
  public evaluate(
    initialMemory: WorkingMemory,
    initialAuditTrail: AuditTrailEntry[] = []
  ): { memory: WorkingMemory; auditTrail: AuditTrailEntry[] } {
    // Clone memory and audit trail
    const memory: WorkingMemory = JSON.parse(JSON.stringify(initialMemory));
    const auditTrail: AuditTrailEntry[] = [...initialAuditTrail];
    
    const firedRuleIds = new Set<string>();
    let factDerived = true;

    // 4. Terminate: Continue until no new rules fire
    while (factDerived) {
      factDerived = false;

      // 1. Match
      const matchedRules = this.rules.filter(rule => 
        !firedRuleIds.has(rule.id) && this.checkAntecedents(rule.antecedents, memory)
      );

      if (matchedRules.length === 0) {
        break;
      }

      // 2. Resolve
      matchedRules.sort((a, b) => b.metadata.priority - a.metadata.priority);
      const ruleToFire = matchedRules[0];

      // 3. Act
      const { fact, value } = ruleToFire.consequent;
      
      // Asserts derived facts with a weight of 0 so they don't artificially inflate severity
      memory[fact] = { value, weight: 0 };
      firedRuleIds.add(ruleToFire.id);

      const timestamp = Date.now();

      auditTrail.push({
        id: this.generateId(),
        timestamp,
        type: 'RULE_FIRED',
        ruleId: ruleToFire.id
      });

      auditTrail.push({
        id: this.generateId(),
        timestamp,
        type: 'FACT_DERIVED',
        fact,
        value,
        sourceRuleId: ruleToFire.id
      });

      factDerived = true;
    }

    // --- Section 7.3: Fact Confidence & Weighted Severity Logic ---
    // Calculate aggregate severity from all active facts in Working Memory
    let aggregateScore = 0;
    for (const key in memory) {
      if (memory[key].value) {
        aggregateScore += (memory[key].weight || 0);
      }
    }

    // We can simulate an override rule by checking the threshold
    if (aggregateScore >= 1.0) {
      auditTrail.push({
        id: this.generateId(),
        timestamp: Date.now(),
        type: 'AGGREGATE_SEVERITY_OVERRIDE',
        aggregateScore,
        thresholdCrossed: 1.0,
        newRiskCategory: 'Red'
      });
    } else if (aggregateScore >= 0.5) {
      auditTrail.push({
        id: this.generateId(),
        timestamp: Date.now(),
        type: 'AGGREGATE_SEVERITY_OVERRIDE',
        aggregateScore,
        thresholdCrossed: 0.5,
        newRiskCategory: 'Amber'
      });
    }

    return { memory, auditTrail };
  }

  /**
   * Checks if rule conditions are satisfied against the Working Memory.
   * IMPLEMENTS SMART PARTIAL MATCHING:
   * - Rules with 1 or 2 symptoms require 100% exact match.
   * - Rules with 3 or more symptoms require only a 66% match (e.g. 2 out of 3).
   * This makes the offline engine more robust to incomplete user inputs.
   */
  private checkAntecedents(antecedents: RuleCondition[], memory: WorkingMemory): boolean {
    if (!antecedents || antecedents.length === 0) return false;

    let matchCount = 0;
    
    for (const condition of antecedents) {
      const factState = memory[condition.fact] || { value: false, weight: 0 };
      const factValue = factState.value;

      if (condition.operator === 'EQUALS') {
        if (factValue === condition.value) matchCount++;
      } else if (condition.operator === 'NOT_EQUALS') {
        if (factValue !== condition.value) matchCount++;
      }
    }

    let requiredMatches = antecedents.length;
    
    // Partial Match Logic for Complex Rules
    if (antecedents.length >= 3) {
      requiredMatches = Math.ceil(antecedents.length * 0.66);
    }

    return matchCount >= requiredMatches;
  }

  /**
   * Generates a simple collision-resistant ID for audit entries.
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }
}

