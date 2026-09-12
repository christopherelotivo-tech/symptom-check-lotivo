import { Rule } from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class RuleValidator {
  /**
   * Validates a candidate rule against a set of existing rules.
   * Ensures the rule ID is unique and doesn't introduce circular dependencies.
   *
   * @param candidateRule The new rule to be added.
   * @param existingRules The current list of rules from the database.
   * @returns ValidationResult with boolean flag and array of error messages.
   */
  public static validate(candidateRule: Rule, existingRules: Rule[]): ValidationResult {
    const errors: string[] = [];

    // 1. Duplicate Rule ID Check
    if (existingRules.some(rule => rule.id === candidateRule.id)) {
      errors.push(`Duplicate Rule ID: A rule with ID '${candidateRule.id}' already exists.`);
    }

    // 2. Circular Dependency & Infinite Loop Detection
    const allRules = [...existingRules, candidateRule];
    if (this.hasCircularDependency(allRules)) {
      errors.push(`Circular Dependency: Adding this rule creates a circular dependency (infinite loop) in the rule graph.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Performs a graph cycle check (White-Gray-Black DFS) on the fact dependency graph.
   * In this graph, nodes are facts, and edges go from antecedent facts to consequent facts.
   *
   * @param rules The combined list of rules.
   * @returns true if a cycle is detected, false otherwise.
   */
  private static hasCircularDependency(rules: Rule[]): boolean {
    // Adjacency list: fact -> set of facts derived from it
    const graph = new Map<string, Set<string>>();

    // Build the directed graph
    for (const rule of rules) {
      const consequentFact = rule.consequent.fact;
      for (const condition of rule.antecedents) {
        const antecedentFact = condition.fact;
        if (!graph.has(antecedentFact)) {
          graph.set(antecedentFact, new Set());
        }
        graph.get(antecedentFact)!.add(consequentFact);
      }
    }

    // State tracking for DFS:
    // 0 / undefined = unvisited (white)
    // 1 = visiting (gray - currently in recursion stack)
    // 2 = fully visited (black - no cycles downstream)
    const state = new Map<string, 1 | 2>();

    const visit = (node: string): boolean => {
      state.set(node, 1); // Mark as visiting

      const neighbors = graph.get(node) || new Set();
      for (const neighbor of neighbors) {
        const neighborState = state.get(neighbor);
        
        if (neighborState === 1) {
          // Found a node currently in the recursion stack -> cycle detected
          return true;
        }
        
        if (neighborState !== 2) {
          // Node is unvisited, recurse
          if (visit(neighbor)) {
            return true;
          }
        }
      }

      state.set(node, 2); // Mark as fully visited
      return false;
    };

    // Check every node (handles disconnected subgraphs)
    for (const node of graph.keys()) {
      if (!state.has(node)) {
        if (visit(node)) {
          return true;
        }
      }
    }

    return false;
  }
}

