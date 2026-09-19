import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { InferenceEngine }     from '../engine/InferenceEngine';
import {
  AuditTrailEntry,
  Rule,
  RuleFiredAuditEntry,
  TriageResult,
  UserInputAuditEntry,
  WorkingMemory,
} from '../engine/types';
import { initDatabase, loadUnifiedRules } from '../database/DatabaseService';
import SymptomForm   from '../components/SymptomForm';
import TriageCard    from '../components/TriageCard';
import AuditTrailView from '../components/AuditTrailView';

// ---------------------------------------------------------------------------
// Risk-rank helper (Red beats Amber beats Green)
// ---------------------------------------------------------------------------

const RISK_RANK: Record<string, number> = { Red: 3, Amber: 2, Green: 1 };

/**
 * Derives a single TriageResult from the engine's full audit trail.
 *
 * Selects the highest-risk rule that fired (Red > Amber > Green),
 * breaking ties by priority. Returns null when no rules fired.
 */
function deriveTriageResult(
  auditTrail: AuditTrailEntry[],
  rules: Rule[]
): TriageResult | null {
  const overrideEntry = auditTrail.find(e => e.type === 'AGGREGATE_SEVERITY_OVERRIDE') as any;

  const firedRuleIds = auditTrail
    .filter((e): e is RuleFiredAuditEntry => e.type === 'RULE_FIRED')
    .map(e => e.ruleId);

  if (overrideEntry) {
    return {
      riskCategory: overrideEntry.newRiskCategory,
      triageAdvice: `We noticed a combination of severe symptoms. Please seek clinical evaluation immediately.`,
      description: `Your combined symptom severity score reached ${overrideEntry.aggregateScore.toFixed(1)}, triggering an automatic safety escalation.`,
      firedRuleIds,
    };
  }

  if (firedRuleIds.length === 0) return null;

  const ruleMap = new Map(rules.map(r => [r.id, r]));

  const primaryRule = firedRuleIds
    .map(id => ruleMap.get(id))
    .filter((r): r is Rule => r !== undefined)
    .sort((a, b) => {
      const riskDiff =
        (RISK_RANK[b.metadata.riskCategory] ?? 0) -
        (RISK_RANK[a.metadata.riskCategory] ?? 0);
      return riskDiff !== 0 ? riskDiff : b.metadata.priority - a.metadata.priority;
    })[0];

  if (!primaryRule) return null;

  return {
    riskCategory: primaryRule.metadata.riskCategory,
    triageAdvice: primaryRule.metadata.triageAdvice,
    description:  primaryRule.metadata.description,
    firedRuleIds,
  };
}

/**
 * Builds the initial USER_INPUT audit trail entries from current Working Memory.
 * Only facts that are explicitly set to `true` are recorded (absent symptoms
 * are not clinically interesting).
 */
function buildUserInputEntries(memory: WorkingMemory): UserInputAuditEntry[] {
  return Object.entries(memory)
    .filter(([, state]) => state.value === true)
    .map(([fact]) => ({
      id:        Math.random().toString(36).slice(2) + Date.now().toString(36),
      timestamp: Date.now(),
      type:      'USER_INPUT' as const,
      fact,
      value:     true,
    }));
}

// ---------------------------------------------------------------------------
// Tab type
import SeverityGauge from '../components/SeverityGauge';

import BottomNav from '../components/BottomNav';

// ---------------------------------------------------------------------------
// Type & Config
// ---------------------------------------------------------------------------

type TabState = 'SYMPTOMS' | 'RESULTS';

interface UserAssessmentScreenProps {
  onSwitchToWelcome: () => void;
}

export default function UserAssessmentScreen({ onSwitchToWelcome }: UserAssessmentScreenProps) {
  // ── Core state ───────────────────────────────────────────────────────────
  const [rules,        setRules]        = useState<Rule[]>([]);
  const [memory,       setMemory]       = useState<WorkingMemory>({});
  const [auditTrail,   setAuditTrail]   = useState<AuditTrailEntry[]>([]);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState<TabState>('SYMPTOMS');
  const [isLoading,    setIsLoading]    = useState<boolean>(true);
  const [loadError,    setLoadError]    = useState<string | null>(null);

  // Memoised engine instance — rebuilt only when the rule set changes.
  const engineRef = useRef<InferenceEngine | null>(null);
  useMemo(() => {
    engineRef.current = rules.length > 0 ? new InferenceEngine(rules) : null;
  }, [rules]);

  // ── 1. On mount: initialise DB and load rules ────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await initDatabase();
        const loaded = await loadUnifiedRules();
        if (!cancelled) {
          setRules(loaded);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Failed to load rules.'
          );
          setIsLoading(false);
        }
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, []);

  // ── 2. Re-evaluate whenever Working Memory changes ────────────────────────
  const runEvaluation = useCallback(
    (nextMemory: WorkingMemory, currentRules: Rule[]) => {
      const engine = engineRef.current;
      if (!engine || currentRules.length === 0) return;

      // Seed the audit trail with USER_INPUT entries first.
      const userInputs = buildUserInputEntries(nextMemory);
      const result = engine.evaluate(nextMemory, userInputs);

      setAuditTrail(result.auditTrail);
      setTriageResult(deriveTriageResult(result.auditTrail, currentRules));
    },
    []
  );

  // ── 3. Symptom toggle handler ─────────────────────────────────────────────
  const handleToggle = useCallback(
    (fact: string, value: boolean, weight: number) => {
      setMemory(prev => {
        const nextMemory = { ...prev, [fact]: { value, weight } };
        // Evaluate immediately after mutating Working Memory.
        runEvaluation(nextMemory, rules);
        return nextMemory;
      });
    },
    [rules, runEvaluation]
  );

  // ── Tab change — auto-switch to Results when engine fires rules ───────────
  const handleTabChange = useCallback((tab: TabState) => {
    setActiveTab(tab);
  }, []);

  // Unread results badge: show when on Symptoms tab and results are available.
  const hasResults      = triageResult !== null;
  const showResultsBadge = activeTab === 'SYMPTOMS' && hasResults;

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, styles.centred]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading clinical rules…</Text>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={[styles.root, styles.centred]}>
        <Text style={styles.errorIcon}>⚠</Text>
        <Text style={styles.errorTitle}>Could not load rules</Text>
        <Text style={styles.errorBody}>{loadError}</Text>
      </SafeAreaView>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ArayKo!</Text>
          <Text style={styles.headerSubtitle}>Symptom Assessment</Text>
        </View>
        <Pressable 
          style={(state: any) => [
            styles.homeBtn,
            state.hovered && styles.homeBtnHovered,
            state.pressed && styles.homeBtnPressed
          ]} 
          onPress={onSwitchToWelcome}
          accessibilityLabel="Back to Home"
        >
          <Feather name="home" size={22} color="#059669" />
        </Pressable>
      </View>

      {/* ── Tab content ──────────────────────────────────────────── */}
      <View style={styles.content}>
        {activeTab === 'SYMPTOMS' ? (
          <View style={styles.symptomsContent}>
            <SeverityGauge memory={memory} />
            <SymptomForm
              memory={memory}
              onToggle={handleToggle}
            />
          </View>
        ) : (
          <ScrollView
            style={styles.resultsScroll}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Triage result card */}
            <TriageCard result={triageResult} />

            {/* Execution trace accordion */}
            <AuditTrailView auditTrail={auditTrail} />

            {/* Rule count footer */}
            {rules.length > 0 && (
              <Text style={styles.footerNote}>
                Knowledge base: {rules.length} rule{rules.length !== 1 ? 's' : ''} active
              </Text>
            )}
          </ScrollView>
        )}
      </View>

      {/* ── Bottom Nav ───────────────────────────────────────────── */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={[
          { id: 'SYMPTOMS', label: 'Symptoms', icon: 'clipboard' },
          { id: 'RESULTS', label: hasResults ? 'Results 🔴' : 'Results', icon: 'activity' }
        ]}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const COLORS = {
  primary:    '#10B981', // Emerald Green
  bg:         '#F0FDF4', // Soft Mint
  card:       '#FFFFFF',
  border:     '#D1FAE5', // Light Green border
  title:      '#064E3B', // Deep Forest Green
  subtitle:   '#64748B',
  tabBg:      '#F1F5F9',
  tabActive:  '#FFFFFF',
  tabText:    '#64748B',
  tabTextActive: '#0F172A',
  green:      '#16A34A',
  amber:      '#D97706',
  red:        '#E11D48',
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centred: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    position: 'relative',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#064E3B',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
  },
  homeBtn: {
    position: 'absolute',
    right: 20,
    bottom: 12,
    padding: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtnHovered: {
    backgroundColor: '#D1FAE5',
  },
  homeBtnPressed: {
    backgroundColor: '#A7F3D0',
    transform: [{ scale: 0.94 }],
  },

  // ── Tab bar ──────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.tabBg,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 7,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.tabActive,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.tabText,
  },
  tabTextActive: {
    color: COLORS.tabTextActive,
    fontWeight: '600',
  },
  badge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 6,
    color: '#FFF',
  },

  // ── Content ──────────────────────────────────────────────────────────────
  content: {
    flex: 1,
  },
  symptomsContent: {
    flex: 1,
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
    gap: 14,
  },

  // ── Loading / error ───────────────────────────────────────────────────────
  loadingText: {
    fontSize: 14,
    color: COLORS.subtitle,
    marginTop: 8,
  },
  errorIcon: {
    fontSize: 36,
    color: COLORS.amber,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.title,
  },
  errorBody: {
    fontSize: 13,
    color: COLORS.subtitle,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 19,
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footerNote: {
    fontSize: 11,
    color: COLORS.subtitle,
    textAlign: 'center',
    paddingTop: 4,
  },
});
