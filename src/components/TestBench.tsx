import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { getAllRules } from '../database/DatabaseService';
import { InferenceEngine } from '../engine/InferenceEngine';
import {
  AuditTrailEntry,
  FactDerivedAuditEntry,
  Rule,
  RuleFiredAuditEntry,
  WorkingMemory,
} from '../engine/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts all unique antecedent facts from the rule base.
 * We exclude facts that are purely derived (only appear in consequents)
 * so the admin only toggles true "inputs".
 */
function getInputFacts(rules: Rule[]): string[] {
  const antecedents = new Set<string>();
  const consequents = new Set<string>();

  rules.forEach(rule => {
    rule.antecedents.forEach(a => antecedents.add(a.fact));
    consequents.add(rule.consequent.fact);
  });

  // A true input is an antecedent that is never derived by another rule.
  const inputs = Array.from(antecedents).filter(f => !consequents.has(f));
  
  // Fallback: if all rules are completely chained, just show all antecedents
  return inputs.length > 0 ? inputs : Array.from(antecedents);
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TestBench() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [memory, setMemory] = useState<WorkingMemory>({});
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);

  // Derived state
  const engine = useMemo(() => new InferenceEngine(rules), [rules]);
  const inputFacts = useMemo(() => getInputFacts(rules).sort(), [rules]);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      // Use getAllRules to include both active and inactive rules for admin testing
      const loadedRules = await getAllRules();
      setRules(loadedRules);
    } catch (error) {
      console.error('Failed to load rules for Test Bench', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (fact: string, value: boolean) => {
    const nextMemory = { ...memory, [fact]: value };
    setMemory(nextMemory);

    // Create seed audit trail for user inputs
    const userInputs: AuditTrailEntry[] = Object.entries(nextMemory)
      .filter(([, val]) => val === true)
      .map(([f]) => ({
        id: Math.random().toString(36).slice(2),
        timestamp: Date.now(),
        type: 'USER_INPUT',
        fact: f,
        value: true,
      }));

    // Real-time evaluation
    const result = engine.evaluate(nextMemory, userInputs);
    setAuditTrail(result.auditTrail);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading Rule Base...</Text>
      </View>
    );
  }

  // Extract sequence for visual output
  const firedRules = auditTrail.filter((e): e is RuleFiredAuditEntry => e.type === 'RULE_FIRED');
  const derivedFacts = auditTrail.filter((e): e is FactDerivedAuditEntry => e.type === 'FACT_DERIVED');

  // Find the final triage outcome
  const ruleMap = new Map(rules.map(r => [r.id, r]));
  const riskRank: Record<string, number> = { Red: 3, Amber: 2, Green: 1 };
  
  const finalOutcome = firedRules
    .map(e => ruleMap.get(e.ruleId))
    .filter((r): r is Rule => r !== undefined)
    .sort((a, b) => {
      const diff = (riskRank[b.metadata.riskCategory] || 0) - (riskRank[a.metadata.riskCategory] || 0);
      return diff !== 0 ? diff : b.metadata.priority - a.metadata.priority;
    })[0];

  return (
    <View style={styles.container}>
      {/* ── Virtual Symptoms Panel ── */}
      <View style={styles.leftPanel}>
        <Text style={styles.panelTitle}>Virtual Symptoms</Text>
        <Text style={styles.panelSubtitle}>Toggle to trigger engine evaluation</Text>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {inputFacts.length === 0 ? (
            <Text style={styles.emptyText}>No input facts detected in rules.</Text>
          ) : (
            inputFacts.map(fact => {
              const isActive = !!memory[fact];
              return (
                <View key={fact} style={styles.switchRow}>
                  <Text style={styles.factText}>{fact}</Text>
                  <Switch
                    value={isActive}
                    onValueChange={val => handleToggle(fact, val)}
                    trackColor={{ false: '#D1D5DB', true: '#6366F1' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* ── Engine Output Panel (Slide-out) ── */}
      <View style={styles.rightPanel}>
        <View style={styles.panelHeaderRow}>
          <Text style={styles.panelTitle}>Engine Output</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        
        {/* Triage Output Card */}
        <View style={styles.outcomeCard}>
          <Text style={styles.outcomeLabel}>FINAL TRIAGE RISK</Text>
          {finalOutcome ? (
            <View>
              <Text style={[styles.outcomeRisk, { color: getRiskColor(finalOutcome.metadata.riskCategory) }]}>
                {finalOutcome.metadata.riskCategory.toUpperCase()}
              </Text>
              <Text style={styles.outcomeAdvice}>{finalOutcome.metadata.triageAdvice}</Text>
            </View>
          ) : (
            <Text style={styles.outcomeNone}>No matching rules</Text>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Execution Trace */}
          <Text style={styles.sectionHeader}>Priority Resolution Order</Text>
          {firedRules.length === 0 ? (
            <Text style={styles.emptyText}>Engine idle.</Text>
          ) : (
            firedRules.map((entry, index) => {
              const ruleDef = ruleMap.get(entry.ruleId);
              return (
                <View key={entry.id} style={styles.traceCard}>
                  <View style={styles.traceHeader}>
                    <Text style={styles.traceStep}>{index + 1}. {entry.ruleId}</Text>
                    <Text style={styles.tracePriority}>Priority {ruleDef?.metadata.priority}</Text>
                  </View>
                  <Text style={styles.traceDetail}>
                    Derived: <Text style={styles.derivedText}>{ruleDef?.consequent.fact} = {String(ruleDef?.consequent.value)}</Text>
                  </Text>
                </View>
              );
            })
          )}

          {/* Derived Intermediate Facts */}
          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Derived Intermediate Facts</Text>
          {derivedFacts.length === 0 ? (
            <Text style={styles.emptyText}>No facts derived.</Text>
          ) : (
            <View style={styles.factBox}>
              {derivedFacts.map(entry => (
                <View key={entry.id} style={styles.factRow}>
                  <Text style={styles.factKey}>{entry.fact}</Text>
                  <Text style={styles.factValue}>{String(entry.value).toUpperCase()}</Text>
                  <Text style={styles.factSource}>via {entry.sourceRuleId}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styling
// ---------------------------------------------------------------------------

function getRiskColor(risk: string) {
  switch (risk) {
    case 'Red': return '#E11D48';
    case 'Amber': return '#D97706';
    case 'Green': return '#16A34A';
    default: return '#374151';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row', // Ensure it's horizontal
    backgroundColor: '#F1F5F9', // Subtle contrast for the panel
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftPanel: {
    flex: 0.45,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  rightPanel: {
    flex: 0.55,
    backgroundColor: '#FFFFFF',
    padding: 20,
    // Slide-out panel effect
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    borderLeftWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 1,
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  panelSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  factText: {
    fontSize: 15,
    fontFamily: 'monospace',
    color: '#374151',
  },
  
  // Outcome Card
  outcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  outcomeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  outcomeRisk: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  outcomeAdvice: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  outcomeNone: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Trace Output
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  traceCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  traceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  traceStep: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'monospace',
  },
  tracePriority: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  traceDetail: {
    fontSize: 12,
    color: '#6B7280',
  },
  derivedText: {
    fontWeight: '600',
    color: '#059669',
    fontFamily: 'monospace',
  },

  // Derived Facts box
  factBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  factKey: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#111827',
    fontWeight: '600',
  },
  factValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginRight: 12,
  },
  factSource: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#9CA3AF',
  },
});

