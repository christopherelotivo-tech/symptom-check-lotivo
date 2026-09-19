import { InferenceEngine } from '../InferenceEngine';
import { Rule, WorkingMemory } from '../types';

describe('InferenceEngine', () => {
  // Sample JSON rule set based on clinical logic
  const sampleRules: Rule[] = [
    {
      id: 'RULE_SEVERE_RESP_RISK',
      antecedents: [
        { fact: 'fever', operator: 'EQUALS', value: true },
        { fact: 'shortness_of_breath', operator: 'EQUALS', value: true }
      ],
      consequent: { fact: 'severe_respiratory_risk', value: true },
      metadata: { 
        priority: 50, 
        riskCategory: 'Red', 
        triageAdvice: 'Urgent Care', 
        description: 'Detects severe respiratory issues' 
      }
    },
    {
      id: 'RULE_REFER_ER',
      antecedents: [
        { fact: 'severe_respiratory_risk', operator: 'EQUALS', value: true }
      ],
      consequent: { fact: 'refer_to_er', value: true },
      metadata: { 
        priority: 100, 
        riskCategory: 'Red', 
        triageAdvice: 'Go to ER immediately', 
        description: 'Chained rule for ER referral' 
      }
    },
    {
      id: 'RULE_MILD_FEVER_ADVICE',
      antecedents: [
        { fact: 'fever', operator: 'EQUALS', value: true }
      ],
      consequent: { fact: 'drink_fluids', value: true },
      metadata: { 
        priority: 10, 
        riskCategory: 'Green', 
        triageAdvice: 'Rest and drink fluids', 
        description: 'Basic fever advice' 
      }
    }
  ];

  let engine: InferenceEngine;

  beforeEach(() => {
    engine = new InferenceEngine(sampleRules);
  });

  it('1. should seed Working Memory and trigger forward chaining', () => {
    const initialMemory: WorkingMemory = {
      fever: { value: true, weight: 0 },
      shortness_of_breath: { value: true, weight: 0 }
    };

    const { memory } = engine.evaluate(initialMemory);

    // Validate that the correct fact was derived by forward chaining
    expect(memory['severe_respiratory_risk']?.value).toBe(true);
  });

  it('2. should derive intermediate facts through multiple rules', () => {
    const initialMemory: WorkingMemory = {
      fever: { value: true, weight: 0 },
      shortness_of_breath: { value: true, weight: 0 }
    };

    const { memory } = engine.evaluate(initialMemory);

    // Chaining sequence:
    // (fever + shortness_of_breath) -> severe_respiratory_risk -> refer_to_er
    expect(memory['severe_respiratory_risk']?.value).toBe(true);
    expect(memory['refer_to_er']?.value).toBe(true);
    expect(memory['drink_fluids']?.value).toBe(true);
  });

  it('3. should execute matching rules in descending priority order', () => {
    const initialMemory: WorkingMemory = {
      fever: { value: true, weight: 0 },
      shortness_of_breath: { value: true, weight: 0 }
    };

    const { auditTrail } = engine.evaluate(initialMemory);

    // Extract rule IDs in the exact order they fired
    const firedRuleIds = auditTrail
      .filter(entry => entry.type === 'RULE_FIRED')
      // @ts-ignore - TS doesn't narrow cleanly here without custom type guards
      .map(entry => entry.ruleId);

    // Expected firing order:
    // Pass 1: RULE_SEVERE_RESP_RISK (50) beats RULE_MILD_FEVER_ADVICE (10)
    // Pass 2 (new fact): RULE_REFER_ER (100) beats RULE_MILD_FEVER_ADVICE (10)
    // Pass 3: RULE_MILD_FEVER_ADVICE (10) fires
    expect(firedRuleIds).toEqual([
      'RULE_SEVERE_RESP_RISK',
      'RULE_REFER_ER',
      'RULE_MILD_FEVER_ADVICE'
    ]);
  });

  it('4. should record rule firings and derived facts in a clear Audit Trail', () => {
    const initialMemory: WorkingMemory = {
      fever: { value: true, weight: 0.3 },
      shortness_of_breath: { value: true, weight: 0.8 }
    };

    const { auditTrail } = engine.evaluate(initialMemory);

    const ruleFirings = auditTrail.filter(entry => entry.type === 'RULE_FIRED');
    const derivedFacts = auditTrail.filter(entry => entry.type === 'FACT_DERIVED');

    // Should have exactly 3 firings and 3 derived facts
    expect(ruleFirings).toHaveLength(3);
    expect(derivedFacts).toHaveLength(3);

    // Inspect the properties of a specific derived fact entry
    const firstDerivedFact = derivedFacts[0];
    expect(firstDerivedFact).toMatchObject({
      type: 'FACT_DERIVED',
      fact: 'severe_respiratory_risk',
      value: true,
      sourceRuleId: 'RULE_SEVERE_RESP_RISK'
    });

    // Verify system properties for all items
    auditTrail.forEach(entry => {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.timestamp).toBe('number');
      expect(entry.timestamp).toBeLessThanOrEqual(Date.now());
    });
  });
});

