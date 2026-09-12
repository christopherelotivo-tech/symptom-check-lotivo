import { RuleValidator } from '../RuleValidator';
import { Rule } from '../types';

describe('RuleValidator', () => {
  const existingRules: Rule[] = [
    {
      id: 'RULE_1',
      antecedents: [{ fact: 'fact_a', operator: 'EQUALS', value: true }],
      consequent: { fact: 'fact_b', value: true },
      metadata: { priority: 10, riskCategory: 'Green', triageAdvice: '', description: '' },
    },
    {
      id: 'RULE_2',
      antecedents: [{ fact: 'fact_b', operator: 'EQUALS', value: true }],
      consequent: { fact: 'fact_c', value: true },
      metadata: { priority: 10, riskCategory: 'Green', triageAdvice: '', description: '' },
    },
  ];

  it('accepts a valid new rule without cycles or duplicate IDs', () => {
    const candidateRule: Rule = {
      id: 'RULE_3',
      antecedents: [{ fact: 'fact_c', operator: 'EQUALS', value: true }],
      consequent: { fact: 'fact_d', value: true },
      metadata: { priority: 10, riskCategory: 'Green', triageAdvice: '', description: '' },
    };

    const result = RuleValidator.validate(candidateRule, existingRules);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects a rule with a duplicate ID', () => {
    const candidateRule: Rule = {
      id: 'RULE_2', // Duplicate ID
      antecedents: [{ fact: 'fact_x', operator: 'EQUALS', value: true }],
      consequent: { fact: 'fact_y', value: true },
      metadata: { priority: 10, riskCategory: 'Green', triageAdvice: '', description: '' },
    };

    const result = RuleValidator.validate(candidateRule, existingRules);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining("Duplicate Rule ID"));
  });

  it('rejects a rule that creates a direct circular dependency', () => {
    const candidateRule: Rule = {
      id: 'RULE_3',
      // RULE_1 is A -> B. This new rule is B -> A, creating a direct cycle.
      antecedents: [{ fact: 'fact_b', operator: 'EQUALS', value: true }],
      consequent: { fact: 'fact_a', value: true },
      metadata: { priority: 10, riskCategory: 'Green', triageAdvice: '', description: '' },
    };

    const result = RuleValidator.validate(candidateRule, existingRules);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining("Circular Dependency"));
  });

  it('rejects a rule that creates an indirect (deep) circular dependency', () => {
    const candidateRule: Rule = {
      id: 'RULE_3',
      // Existing rules: A -> B -> C. This rule: C -> A, creating a 3-node cycle.
      antecedents: [{ fact: 'fact_c', operator: 'EQUALS', value: true }],
      consequent: { fact: 'fact_a', value: true },
      metadata: { priority: 10, riskCategory: 'Green', triageAdvice: '', description: '' },
    };

    const result = RuleValidator.validate(candidateRule, existingRules);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining("Circular Dependency"));
  });

  it('accepts valid disjoint subgraphs', () => {
    const candidateRule: Rule = {
      id: 'RULE_3',
      antecedents: [{ fact: 'fact_x', operator: 'EQUALS', value: true }],
      consequent: { fact: 'fact_y', value: true },
      metadata: { priority: 10, riskCategory: 'Green', triageAdvice: '', description: '' },
    };

    const result = RuleValidator.validate(candidateRule, existingRules);
    
    expect(result.isValid).toBe(true);
  });
});

