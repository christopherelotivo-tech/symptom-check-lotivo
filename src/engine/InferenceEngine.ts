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

      // 1. Match — collect rules with their match quality
      const matchedRules: { rule: Rule; matchQuality: number }[] = [];
      for (const rule of this.rules) {
        if (firedRuleIds.has(rule.id)) continue;
        const quality = this.checkAntecedentsWithQuality(rule.antecedents, memory);
        if (quality > 0) {
          matchedRules.push({ rule, matchQuality: quality });
        }
      }

      if (matchedRules.length === 0) {
        break;
      }

      // 2. Resolve — prefer higher priority, then higher match quality
      matchedRules.sort((a, b) => {
        const prioDiff = b.rule.metadata.priority - a.rule.metadata.priority;
        if (prioDiff !== 0) return prioDiff;
        return b.matchQuality - a.matchQuality;
      });
      const best = matchedRules[0];
      const ruleToFire = best.rule;

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
        ruleId: ruleToFire.id,
        matchQuality: best.matchQuality,
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
    } else if (aggregateScore >= 0.6) {
      auditTrail.push({
        id: this.generateId(),
        timestamp: Date.now(),
        type: 'AGGREGATE_SEVERITY_OVERRIDE',
        aggregateScore,
        thresholdCrossed: 0.6,
        newRiskCategory: 'Amber'
      });
    }

    return { memory, auditTrail };
  }

  /**
   * Checks if rule conditions are satisfied against the Working Memory.
   * Returns 0 if not matched, or a quality score (0.01 to 1.0) if matched.
   * - 1.0 = perfect exact match (all positive conditions met)
   * - 0.66 = partial match (66% of positive conditions met)
   * - Negative/Exclusion conditions MUST always be strictly met.
   */
  private checkAntecedentsWithQuality(antecedents: RuleCondition[], memory: WorkingMemory): number {
    if (!antecedents || antecedents.length === 0) return 0;

    let positiveConditions = 0;
    let positiveMatches = 0;
    let exclusionsSatisfied = true;
    
    for (const condition of antecedents) {
      const factState = memory[condition.fact] || { value: false, weight: 0 };
      const factValue = factState.value;

      const isExpectedTrue = 
        (condition.operator === 'EQUALS' && condition.value === true) || 
        (condition.operator === 'NOT_EQUALS' && condition.value === false);

      if (isExpectedTrue) {
        positiveConditions++;
        if (factValue === true) positiveMatches++;
      } else {
        const conditionMet = 
          (condition.operator === 'EQUALS' && factValue === condition.value) ||
          (condition.operator === 'NOT_EQUALS' && factValue !== condition.value);
        
        if (!conditionMet) {
          exclusionsSatisfied = false;
        }
      }
    }

    if (!exclusionsSatisfied) return 0;
    if (positiveConditions === 0) return 0;

    let requiredPositiveMatches = positiveConditions;
    if (positiveConditions >= 3) {
      requiredPositiveMatches = Math.ceil(positiveConditions * 0.66);
    }

    if (positiveMatches < requiredPositiveMatches) return 0;

    // Return quality score: exact match = 1.0, partial = fraction
    return positiveMatches / positiveConditions;
  }

  /**
   * Generates a simple collision-resistant ID for audit entries.
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }
}

