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
    // Clone memory and audit trail to ensure pure and immutable behavior
    const memory: WorkingMemory = { ...initialMemory };
    const auditTrail: AuditTrailEntry[] = [...initialAuditTrail];
    
    // Track rules that have already fired to prevent infinite loops
    const firedRuleIds = new Set<string>();

    let factDerived = true;

    // 4. Terminate: Continue until no new rules fire (no new facts can be derived)
    while (factDerived) {
      factDerived = false;

      // 1. Match: Find all rules where antecedents are satisfied by Working Memory
      const matchedRules = this.rules.filter(rule => 
        !firedRuleIds.has(rule.id) && this.checkAntecedents(rule.antecedents, memory)
      );

      if (matchedRules.length === 0) {
        break; // No more matching rules; terminate the loop.
      }

      // 2. Resolve: Sort matching rules by descending priority.
      matchedRules.sort((a, b) => b.metadata.priority - a.metadata.priority);

      // We select the highest priority rule to fire.
      // (Firing one rule and restarting the match-resolve-act loop ensures we re-evaluate
      // all rules with the newly asserted fact, in case it triggers an even higher priority rule.)
      const ruleToFire = matchedRules[0];

      // 3. Act: Assert consequent into Working Memory and record firing event
      const { fact, value } = ruleToFire.consequent;
      
      memory[fact] = value;
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

      // We derived a fact, meaning we must loop again to evaluate new possibilities
      factDerived = true;
    }

    return { memory, auditTrail };
  }

  /**
   * Checks if all rule conditions are satisfied against the Working Memory.
   * Uses AND logic (Array.prototype.every).
   */
  private checkAntecedents(antecedents: RuleCondition[], memory: WorkingMemory): boolean {
    // An empty antecedents array naturally evaluates to true with .every(),
    // acting as an unconditional default rule if needed.
    return antecedents.every(condition => {
      const factValue = memory[condition.fact];

      if (condition.operator === 'EQUALS') {
        return factValue === condition.value;
      } else if (condition.operator === 'NOT_EQUALS') {
        return factValue !== condition.value;
      }

      return false;
    });
  }

  /**
   * Generates a simple collision-resistant ID for audit entries.
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }
}

