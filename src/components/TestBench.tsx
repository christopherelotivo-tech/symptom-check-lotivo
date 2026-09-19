import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { InferenceEngine } from '../engine/InferenceEngine';
import { Rule, WorkingMemory, AuditTrailEntry, RuleFiredAuditEntry, FactDerivedAuditEntry } from '../engine/types';
import { getAllRules } from '../database/DatabaseService';
import Checkbox from './ui/Checkbox';

export default function TestBench() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [memory, setMemory] = useState<WorkingMemory>({});
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  
  const engine = new InferenceEngine(rules);

  // Extract all unique antecedents to display as virtual switches
  const inputFacts = Array.from(new Set(
    rules.flatMap(r => r.antecedents.map(a => a.fact))
  )).sort();

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const loadedRules = await getAllRules();
      setRules(loadedRules);
    } catch (error) {
      console.error('Failed to load rules for Test Bench', error);
    }
  };

  const handleToggleSymptom = (factKey: string, value: boolean) => {
    // 1. Calculate the new memory state FIRST
    const nextMemory: WorkingMemory = { ...memory };
    nextMemory[factKey] = { value, weight: 0.1 };
    
    // 2. Update React state
    setMemory(nextMemory);

    // 3. Build the Audit Trail
    const userInputs: AuditTrailEntry[] = Object.entries(nextMemory)
      .filter(([, state]) => state.value === true)
      .map(([f]) => ({
        id: Math.random().toString(36).slice(2),
        timestamp: Date.now(),
        type: 'USER_INPUT',
        fact: f,
        value: true,
      }));

    // 4. Run the Engine immediately with the fresh state
    const result = engine.evaluate(nextMemory, userInputs);
    setAuditTrail(result.auditTrail);
  };

  const firedRules = auditTrail.filter((e): e is RuleFiredAuditEntry => e.type === 'RULE_FIRED');
  const derivedFacts = auditTrail.filter((e): e is FactDerivedAuditEntry => e.type === 'FACT_DERIVED');

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
    <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
      {/* ── Virtual Symptoms Panel ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Virtual Patient Simulator</Text>
        <Text style={styles.cardSubtitle}>Toggle facts to trigger real-time evaluation.</Text>
        
        <View style={styles.grid}>
          {inputFacts.length === 0 ? (
            <Text style={styles.emptyText}>No input facts detected in rules.</Text>
          ) : (
            inputFacts.map(fact => {
              const isActive = memory[fact]?.value === true;
              return (
                <View key={fact} style={styles.gridItem}>
                  <Checkbox
                    label={fact.replace(/_/g, ' ')}
                    checked={isActive}
                    onChange={val => handleToggleSymptom(fact, val)}
                  />
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* ── Engine Output Panel ── */}
      <View style={[styles.card, styles.outputCard]}>
        <View style={styles.panelHeaderRow}>
          <Text style={styles.outputTitle}>Engine Output</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.outcomeBox}>
          <Text style={styles.outcomeLabel}>Computed Triage Outcome</Text>
          {finalOutcome ? (
            <View style={[styles.outcomeBadge, { backgroundColor: getRiskColor(finalOutcome.metadata.riskCategory) }]}>
              <Text style={styles.outcomeBadgeText}>
                {finalOutcome.metadata.riskCategory.toUpperCase()} RISK
              </Text>
            </View>
          ) : (
            <Text style={styles.outcomeEmpty}>No matching rule fired</Text>
          )}
          {finalOutcome && (
            <Text style={styles.outcomeAdvice}>{finalOutcome.metadata.triageAdvice}</Text>
          )}
        </View>

        <View style={styles.logSection}>
          <Text style={styles.logHeader}>Rules Fired ({firedRules.length})</Text>
          {firedRules.map((e, idx) => (
            <Text key={e.id} style={styles.logEntry}>
              <Text style={{color: '#F59E0B'}}>⚡</Text> {idx + 1}. {e.ruleId}
            </Text>
          ))}
          {firedRules.length === 0 && <Text style={styles.logEmpty}>None</Text>}
        </View>

        <View style={styles.logSection}>
          <Text style={styles.logHeader}>Derived Facts ({derivedFacts.length})</Text>
          {derivedFacts.map((e, idx) => (
            <Text key={e.id} style={styles.logEntry}>
              <Text style={{color: '#3B82F6'}}>↳</Text> {e.fact} = {String(e.value)}
            </Text>
          ))}
          {derivedFacts.length === 0 && <Text style={styles.logEmpty}>None</Text>}
        </View>
      </View>
    </ScrollView>
  );
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'Red': return '#DC2626';
    case 'Amber': return '#D97706';
    case 'Green': return '#059669';
    default: return '#64748B';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerContent: {
    padding: 24,
    gap: 24,
    paddingBottom: 64,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#064E3B',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 24,
  },
  grid: {
    gap: 8,
  },
  gridItem: {
    width: '100%',
  },
  emptyText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  outputCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    shadowColor: '#10B981',
    shadowOpacity: 0.1,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  outputTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    letterSpacing: -0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  outcomeBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  outcomeLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  outcomeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  outcomeBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  outcomeAdvice: {
    color: '#F8FAFC',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  outcomeEmpty: {
    color: '#64748B',
    fontStyle: 'italic',
  },
  logSection: {
    marginBottom: 24,
  },
  logHeader: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  logEntry: {
    color: '#E2E8F0',
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  logEmpty: {
    color: '#475569',
    fontStyle: 'italic',
  }
});
