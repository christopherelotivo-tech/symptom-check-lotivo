import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { InferenceEngine } from '../engine/InferenceEngine';
import { Rule, WorkingMemory, AuditTrailEntry, RuleFiredAuditEntry, FactDerivedAuditEntry, UserInputAuditEntry } from '../engine/types';
import { getAllRules } from '../database/DatabaseService';
import Checkbox from './ui/Checkbox';
import Accordion from './ui/Accordion';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme/tokens';
import { SymptomAssessment, mapAssessmentsToMemory } from '../utils/ContextMapper';
import SymptomContextCard from './SymptomContextCard';
import { SYMPTOM_CATEGORIES } from './SymptomForm';

const getSymptomLabel = (factKey: string) => {
  for (const cat of SYMPTOM_CATEGORIES) {
    const sym = cat.symptoms.find(s => s.factKey === factKey);
    if (sym) return sym.label;
  }
  return factKey;
};

// Flatten all base symptoms for easy listing in the simulator
const ALL_BASE_SYMPTOMS = SYMPTOM_CATEGORIES.flatMap(cat => cat.symptoms);

export default function TestBench() {
  const [rules, setRules] = useState<Rule[]>([]);
  
  // Patient Simulation State
  const [assessments, setAssessments] = useState<Record<string, SymptomAssessment>>({});
  
  // Advanced Override State
  const [overrideMemory, setOverrideMemory] = useState<WorkingMemory>({});
  
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  
  const engine = useMemo(() => new InferenceEngine(rules), [rules]);

  // Extract all unique antecedents to display as virtual switches in advanced mode
  const allScrapedFacts = Array.from(new Set(
    rules.flatMap(r => r.antecedents.map(a => a.fact))
  )).sort();

  // Filter out any facts that are already handled by Patient Simulation (base symptoms + generated context facts)
  const advancedFacts = allScrapedFacts.filter(fact => {
    // If it's a known base symptom, hide it from overrides
    if (ALL_BASE_SYMPTOMS.some(s => s.factKey === fact)) return false;
    // (Optional) We could also filter out known context keys like `_duration_` but letting them stay in advanced is fine for raw override testing
    return true;
  });

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

  const evaluateEngine = useCallback((newAssessments: Record<string, SymptomAssessment>, newOverrides: WorkingMemory) => {
    const patientMemory = mapAssessmentsToMemory(Object.values(newAssessments));
    const nextMemory: WorkingMemory = { ...patientMemory, ...newOverrides };
    
    const userInputs: UserInputAuditEntry[] = Object.entries(nextMemory)
      .filter(([, state]) => state.value === true)
      .map(([f]) => ({
        id: Math.random().toString(36).slice(2),
        timestamp: Date.now(),
        type: 'USER_INPUT',
        fact: f,
        value: true,
      }));

    const result = engine.evaluate(nextMemory, userInputs);
    setAuditTrail(result.auditTrail);
  }, [engine]);

  // ── Patient Simulator Handlers ──
  const handleToggleBaseSymptom = (factKey: string, value: boolean, weight: number) => {
    setAssessments(prev => {
      const next = { ...prev };
      if (value) {
        next[factKey] = { ...(next[factKey] || { factKey, weight }), active: true };
      } else {
        if (next[factKey]) {
          next[factKey] = { ...next[factKey], active: false };
        }
      }
      evaluateEngine(next, overrideMemory);
      return next;
    });
  };

  const handleContextChange = (fact: string, field: 'durationCode' | 'severityCode', value: string) => {
    setAssessments(prev => {
      const next = { ...prev };
      if (next[fact]) {
        next[fact] = { ...next[fact], [field]: value };
      }
      evaluateEngine(next, overrideMemory);
      return next;
    });
  };

  // ── Advanced Override Handlers ──
  const handleToggleOverride = (factKey: string, value: boolean) => {
    setOverrideMemory(prev => {
      const next = { ...prev };
      next[factKey] = { value, weight: 0 }; // overrides generally don't carry severity weight
      evaluateEngine(assessments, next);
      return next;
    });
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
      if (diff !== 0) return diff;
      const prioDiff = b.metadata.priority - a.metadata.priority;
      if (prioDiff !== 0) return prioDiff;
      // If same risk and priority, the more specific rule (more conditions) wins!
      return b.antecedents.length - a.antecedents.length;
    })[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
      
      {/* ── LIVE OUTPUT AT THE TOP ── */}
      <View style={[styles.card, styles.outputCard]}>
        <View style={styles.panelHeaderRow}>
          <Text style={styles.outputTitle}>Live Assessment Result</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.outcomeBox}>
          <Text style={styles.outcomeLabel}>Computed Triage Result</Text>
          {finalOutcome ? (
            <View style={[styles.outcomeBadge, { backgroundColor: getRiskColor(finalOutcome.metadata.riskCategory) }]}>
              <Text style={styles.outcomeBadgeText}>
                {finalOutcome.metadata.riskCategory.toUpperCase()} RISK
              </Text>
            </View>
          ) : (
            <Text style={styles.outcomeEmpty}>No matching rule fired. Select symptoms below to test.</Text>
          )}
          {finalOutcome && (
            <Text style={styles.outcomeAdvice}>{finalOutcome.metadata.triageAdvice}</Text>
          )}
        </View>

        <Accordion title="View Engine Trace (Why this result?)" icon="terminal">
          <View style={styles.traceContainer}>
            <View style={styles.logSection}>
              <Text style={styles.logHeader}>Working Memory Imputed</Text>
              {Object.entries({ ...mapAssessmentsToMemory(Object.values(assessments)), ...overrideMemory })
                .filter(([, v]) => v.value)
                .map(([f]) => (
                  <Text key={f} style={styles.logEntry}>
                    <Text style={{color: COLORS.brandGreen}}>★</Text> {f}
                  </Text>
                ))}
            </View>

            <View style={styles.logSection}>
              <Text style={styles.logHeader}>Rules Fired ({firedRules.length})</Text>
              {firedRules.map((e, idx) => (
                <Text key={e.id} style={styles.logEntry}>
                  <Text style={{color: COLORS.warning}}>⚡</Text> {idx + 1}. {e.ruleId}
                </Text>
              ))}
              {firedRules.length === 0 && <Text style={styles.logEmpty}>None</Text>}
            </View>

            <View style={styles.logSection}>
              <Text style={styles.logHeader}>Derived Facts ({derivedFacts.length})</Text>
              {derivedFacts.map((e, idx) => (
                <Text key={e.id} style={styles.logEntry}>
                  <Text style={{color: COLORS.brandCyan}}>+ </Text> {e.fact} = {String(e.value)}
                </Text>
              ))}
              {derivedFacts.length === 0 && <Text style={styles.logEmpty}>None</Text>}
            </View>
          </View>
        </Accordion>
      </View>

      {/* ── Patient Simulation Panel ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Simulate Patient</Text>
        <Text style={styles.cardSubtitle}>Select symptoms and context to trace exact clinical behavior.</Text>
        
        <View style={styles.simulationSection}>
          <Text style={styles.sectionHeading}>Symptoms</Text>
          {SYMPTOM_CATEGORIES.map(category => (
            <Accordion key={category.title} title={category.displayName} icon={category.iconName as any} defaultExpanded={false}>
              <View style={[styles.grid, { marginTop: SPACING.md }]}>
                {category.symptoms.map(symptom => {
                  const isActive = assessments[symptom.factKey]?.active === true;
                  return (
                    <View key={symptom.factKey} style={styles.gridItem}>
                      <Checkbox
                        label={symptom.label}
                        checked={isActive}
                        onChange={val => handleToggleBaseSymptom(symptom.factKey, val, symptom.weight)}
                      />
                    </View>
                  );
                })}
              </View>
            </Accordion>
          ))}
        </View>

        {Object.values(assessments).filter(a => a.active).length > 0 && (
          <View style={[styles.simulationSection, { marginTop: SPACING.xl }]}>
            <Text style={styles.sectionHeading}>Context & Modifiers</Text>
            {Object.values(assessments)
              .filter(a => a.active)
              .map(a => (
                <SymptomContextCard
                  key={a.factKey}
                  factKey={a.factKey}
                  symptomName={getSymptomLabel(a.factKey)}
                  assessment={a}
                  onChange={handleContextChange}
                />
              ))}
          </View>
        )}
      </View>

      {/* ── Advanced Fact Overrides ── */}
      <View style={styles.card}>
        <Accordion title="Advanced Fact Overrides" icon="sliders">
          <Text style={[styles.cardSubtitle, { marginTop: SPACING.md }]}>
            Manually force system flags, derived facts, or untracked edge cases.
          </Text>
          <View style={styles.grid}>
            {advancedFacts.length === 0 ? (
              <Text style={styles.emptyText}>No advanced facts detected.</Text>
            ) : (
              advancedFacts.map(fact => {
                const isActive = overrideMemory[fact]?.value === true;
                return (
                  <View key={fact} style={styles.gridItem}>
                    <Checkbox
                      label={fact}
                      checked={isActive}
                      onChange={val => handleToggleOverride(fact, val)}
                    />
                  </View>
                );
              })
            )}
          </View>
        </Accordion>
      </View>
    </ScrollView>
  );
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'Red': return COLORS.triageRedIcon;
    case 'Amber': return COLORS.triageAmberIcon;
    case 'Green': return COLORS.triageGreenIcon;
    default: return COLORS.textMuted;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerContent: {
    padding: SPACING.xl,
    gap: SPACING.xl,
    paddingBottom: 64,
  },
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.md,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    color: COLORS.brandNavy,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.brandBlue,
    fontWeight: TYPOGRAPHY.weight.semibold,
    marginBottom: SPACING.lg,
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  simulationSection: {
    marginBottom: SPACING.sm,
  },
  grid: {
    gap: SPACING.sm,
  },
  gridItem: {
    width: '100%',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  outputCard: {
    backgroundColor: COLORS.brandNavy,
    borderColor: COLORS.brandNavy,
    shadowColor: COLORS.brandGreen,
    shadowOpacity: 0.1,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  outputTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    color: COLORS.bgSurface,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
    letterSpacing: -0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brandGreen,
    marginRight: 6,
  },
  liveText: {
    color: COLORS.brandGreen,
    fontWeight: TYPOGRAPHY.weight.bold,
    fontSize: TYPOGRAPHY.size.xs,
    letterSpacing: 1,
  },
  outcomeBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.xl,
  },
  outcomeLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
  },
  outcomeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    marginBottom: SPACING.md,
  },
  outcomeBadgeText: {
    color: COLORS.bgSurface,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    fontSize: TYPOGRAPHY.size.base,
    letterSpacing: 1,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
  },
  outcomeAdvice: {
    color: COLORS.bgSurface2,
    fontSize: TYPOGRAPHY.size.base,
    lineHeight: 24,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  outcomeEmpty: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  traceContainer: {
    paddingTop: SPACING.md,
  },
  logSection: {
    marginBottom: SPACING.xl,
  },
  logHeader: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
  },
  logEntry: {
    color: COLORS.borderLight,
    fontSize: TYPOGRAPHY.size.sm,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    marginBottom: SPACING.sm,
  },
  logEmpty: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
  }
});
