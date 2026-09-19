import { InferenceEngine } from '../InferenceEngine';
import { Rule, WorkingMemory } from '../types';

describe('InferenceEngine Performance', () => {
  it('should complete a forward-chaining pass of 150+ rules in under 15ms', () => {
    const NUM_RULES = 150;
    const rules: Rule[] = [];

    // Create a chain of rules where Rule N depends on Fact N-1.
    // This forces the engine to run NUM_RULES separate evaluation passes,
    // which is the worst-case scenario for execution complexity.
    for (let i = 0; i < NUM_RULES; i++) {
      const conditionFact = i === 0 ? 'start_fact' : `fact_${i - 1}`;
      rules.push({
        id: `RULE_${i}`,
        antecedents: [
          { fact: conditionFact, operator: 'EQUALS', value: true },
          // Add a dummy short-circuit condition to test lookup speed
          { fact: 'dummy_fact', operator: 'NOT_EQUALS', value: true },
        ],
        consequent: { fact: `fact_${i}`, value: true },
        metadata: {
          priority: i, // Ascending priority
          riskCategory: 'Green',
          triageAdvice: '',
          description: '',
        },
      });
    }

    // Shuffle rules to ensure the engine doesn't benefit from array order
    for (let i = rules.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rules[i], rules[j]] = [rules[j], rules[i]];
    }

    const engine = new InferenceEngine(rules);
    
    const initialMemory: WorkingMemory = {
      start_fact: { value: true, weight: 0 },
      dummy_fact: { value: false, weight: 0 },
    };

    // Warm-up pass to let V8 JIT compile the hot paths
    engine.evaluate(initialMemory);

    // Actual measurement
    const start = performance.now();
    const result = engine.evaluate(initialMemory);
    const end = performance.now();

    const durationMs = end - start;
    
    // Assertions
    // Ensure all rules fired by verifying the last fact in the chain was derived
    expect(result.memory[`fact_${NUM_RULES - 1}`]?.value).toBe(true);
    
    // Validate performance constraint (< 15ms)
    // We log the duration so developers can see the actual timing in Jest output
    console.log(`Forward-chaining pass with ${NUM_RULES} rules took: ${durationMs.toFixed(2)}ms`);
    expect(durationMs).toBeLessThan(15);
  });
});

