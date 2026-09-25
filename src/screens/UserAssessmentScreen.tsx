import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// ── Engine (DO NOT TOUCH) ────────────────────────────────────────────────────
import { InferenceEngine }   from '../engine/InferenceEngine';
import {
  AuditTrailEntry,
  Rule,
  RuleFiredAuditEntry,
  TriageResult,
  UserInputAuditEntry,
  WorkingMemory,
} from '../engine/types';
import { initDatabase, loadUnifiedRules } from '../database/DatabaseService';
// ─────────────────────────────────────────────────────────────────────────────

import SymptomForm, { SYMPTOM_CATEGORIES } from '../components/SymptomForm';
import TriageCard     from '../components/TriageCard';
import AuditTrailView from '../components/AuditTrailView';
import SeverityGauge  from '../components/SeverityGauge';
import BottomNav      from '../components/BottomNav';
import NextStepCard   from '../components/ui/NextStepCard';
import Disclaimer     from '../components/ui/Disclaimer';
import SymptomContextCard from '../components/SymptomContextCard';
import PatientSymptomSummary from '../components/PatientSymptomSummary';
import PrimaryButton from '../components/ui/PrimaryButton';
import LoadingState from '../components/ui/LoadingState';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme/tokens';

// ---------------------------------------------------------------------------
// Risk-rank helper (DO NOT TOUCH — engine logic)
// ---------------------------------------------------------------------------

const RISK_RANK: Record<string, number> = { Red: 3, Amber: 2, Green: 1 };

function deriveTriageResult(
  auditTrail: AuditTrailEntry[],
  rules: Rule[],
  memory: WorkingMemory
): TriageResult | null {
  const overrideEntry = auditTrail.find(e => e.type === 'AGGREGATE_SEVERITY_OVERRIDE') as any;

  const firedRuleIds = auditTrail
    .filter((e): e is RuleFiredAuditEntry => e.type === 'RULE_FIRED')
    .map(e => e.ruleId);

  if (overrideEntry) {
    return {
      riskCategory: overrideEntry.newRiskCategory,
      triageAdvice: 'We noticed a combination of severe symptoms. Please seek clinical evaluation immediately.',
      description:  'Your combined symptoms triggered an automatic safety escalation. Please do not ignore this result.',
      firedRuleIds,
    };
  }

  if (firedRuleIds.length === 0) {
    // Fallback: If no rules fired but the user did report symptoms, default to Green.
    const hasSymptoms = Object.values(memory).some(m => m.value);
    if (hasSymptoms) {
      return {
        riskCategory: 'Green',
        triageAdvice: 'Your symptoms appear to be safe. Rest, stay hydrated, and monitor your condition. Consult a healthcare professional if symptoms worsen.',
        description:  'No severe risk patterns were detected based on your reported symptoms.',
        firedRuleIds: []
      };
    }
    return null;
  }

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
// Types
// ---------------------------------------------------------------------------

type WizardStep = 'SYMPTOMS' | 'CONTEXT' | 'ANALYZING' | 'RESULTS';

interface UserAssessmentScreenProps {
  onSwitchToWelcome: () => void;
}

const getSymptomLabel = (factKey: string) => {
  for (const cat of SYMPTOM_CATEGORIES) {
    const sym = cat.symptoms.find(s => s.factKey === factKey);
    if (sym) return sym.label;
  }
  return factKey;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

import { SymptomAssessment, mapAssessmentsToMemory } from '../utils/ContextMapper';

export default function UserAssessmentScreen({ onSwitchToWelcome }: UserAssessmentScreenProps) {
  const [rules,        setRules]        = useState<Rule[]>([]);
  
  // Phase 1: New Data Architecture
  const [assessments,  setAssessments]  = useState<Record<string, SymptomAssessment>>({});
  const [activeStep,   setActiveStep]   = useState<WizardStep>('SYMPTOMS');
  
  const [auditTrail,   setAuditTrail]   = useState<AuditTrailEntry[]>([]);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  const [isLoading,  setIsLoading]  = useState<boolean>(true);
  const [loadError,  setLoadError]  = useState<string | null>(null);

  // Derived working memory using ContextMapper
  const memory = useMemo(() => mapAssessmentsToMemory(Object.values(assessments)), [assessments]);

  const engineRef = useRef<InferenceEngine | null>(null);
  useMemo(() => {
    engineRef.current = rules.length > 0 ? new InferenceEngine(rules) : null;
  }, [rules]);

  // ── DB init (DO NOT TOUCH) ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        await initDatabase();
        const loaded = await loadUnifiedRules();
        if (!cancelled) { setRules(loaded); setIsLoading(false); }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load assessment data.');
          setIsLoading(false);
        }
      }
    }
    bootstrap();
    return () => { cancelled = true; };
  }, []);

  // ── Evaluation (DO NOT TOUCH) ──────────────────────────────────────────────
  const runEvaluation = useCallback(
    async (nextMemory: WorkingMemory, currentRules: Rule[]) => {
      const engine = engineRef.current;
      if (!engine) return;

      const userInputs: UserInputAuditEntry[] = Object.entries(nextMemory)
        .filter(([_, fact]) => fact.value !== undefined)
        .map(([key, fact]) => ({
          id: Math.random().toString(),
          timestamp: Date.now(),
          type: 'USER_INPUT',
          fact: key,
          value: fact.value!
        }));

      const result = engine.evaluate(nextMemory, userInputs);
      const triage = deriveTriageResult(result.auditTrail, currentRules, nextMemory);
      
      setAuditTrail(result.auditTrail);
      setTriageResult(triage);
      
      // Save history
      if (triage) {
        import('../services/HistoryService').then(({ saveAssessmentHistory }) => {
          const symptomsList = Object.keys(nextMemory).filter(k => nextMemory[k].value === true);
          saveAssessmentHistory(symptomsList, triage, result.auditTrail);
        });
      }
    },
    []
  );

  const handleToggle = useCallback(
    (fact: string, value: boolean, weight: number) => {
      setAssessments(prev => {
        const next = { ...prev };
        if (value) {
          next[fact] = { ...(next[fact] || { factKey: fact, weight }), active: true };
        } else {
          if (next[fact]) {
            next[fact] = { ...next[fact], active: false };
          }
        }
        return next;
      });
    },
    []
  );

  const handleContextChange = useCallback(
    (fact: string, field: 'durationCode' | 'severityCode', value: string) => {
      setAssessments(prev => {
        const next = { ...prev };
        if (next[fact]) {
          next[fact] = { ...next[fact], [field]: value };
        }
        return next;
      });
    },
    []
  );

  const handleNextStep = () => {
    if (activeStep === 'SYMPTOMS') {
      const hasSymptoms = Object.values(assessments).some(a => a.active);
      if (hasSymptoms) setActiveStep('CONTEXT');
      else setActiveStep('ANALYZING');
    } else if (activeStep === 'CONTEXT') {
      setActiveStep('ANALYZING');
    }
  };

  const handlePrevStep = () => {
    if (activeStep === 'RESULTS') setActiveStep('SYMPTOMS');
    else if (activeStep === 'CONTEXT') setActiveStep('SYMPTOMS');
  };

  const handleResetAssessment = useCallback(() => {
    setAssessments({});
    setTriageResult(null);
    setAuditTrail([]);
    setActiveStep('SYMPTOMS');
  }, []);

  // Run evaluation when moving to ANALYZING step
  useEffect(() => {
    if (activeStep === 'ANALYZING') {
      const timer = setTimeout(() => {
        runEvaluation(memory, rules);
        setActiveStep('RESULTS');
      }, 1000); // 1 second trust-building delay
      return () => clearTimeout(timer);
    }
  }, [activeStep, memory, rules, runEvaluation]);
  // ─────────────────────────────────────────────────────────────────────────

  const hasResults      = triageResult !== null;
  const selectedCount   = Object.values(memory).filter(f => f.value && f.weight > 0).length;

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading || activeStep === 'ANALYZING') {
    return (
      <LoadingState 
        message={activeStep === 'ANALYZING' ? 'Evaluating your symptoms...' : 'Preparing your assessment…'}
      />
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={[styles.root, styles.centred]}>
        <Text style={styles.errorIcon}>⚠</Text>
        <Text style={styles.errorTitle}>Unable to start assessment</Text>
        <Text style={styles.errorBody}>{loadError}</Text>
      </SafeAreaView>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {activeStep !== 'SYMPTOMS' && (
          <Pressable 
            style={styles.backBtn}
            onPress={handlePrevStep}
            accessibilityRole="button"
          >
            <Feather name="arrow-left" size={20} color={COLORS.brandNavy} />
          </Pressable>
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ArayKo!</Text>
          <Text style={styles.headerSubtitle}>
            {activeStep === 'RESULTS' ? 'Your Assessment' : 'Symptom Check'}
          </Text>
        </View>
        <Pressable
          style={(state: any) => [
            styles.homeBtn,
            state.hovered && styles.homeBtnHovered,
            state.pressed && styles.homeBtnPressed,
          ]}
          onPress={onSwitchToWelcome}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <Feather name="home" size={20} color={COLORS.brandNavy} />
        </Pressable>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {activeStep === 'SYMPTOMS' && (
          <View style={styles.symptomsContent}>
            {selectedCount > 0 && (
              <View 
                style={styles.counterBanner} 
                accessibilityLiveRegion="polite"
              >
                <Feather name="check-circle" size={14} color={COLORS.brandGreen} />
                <Text style={styles.counterText}>
                  {selectedCount} symptom{selectedCount !== 1 ? 's' : ''} selected
                </Text>
              </View>
            )}
            <SymptomForm memory={memory} onToggle={handleToggle} />
            <PrimaryButton 
              label="Next"
              onPress={handleNextStep}
              disabled={selectedCount === 0}
              style={{ marginHorizontal: SPACING.xl, marginBottom: SPACING.xxxl }}
            />
          </View>
        )}

        {activeStep === 'CONTEXT' && (
          <View style={styles.symptomsContent}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: SPACING.xl, paddingBottom: SPACING.xxxl }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.formTitle}>Tell us a bit more.</Text>
              <Text style={styles.formSubtitle}>
                This helps us give you a more accurate result. All questions below are optional.
              </Text>

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
            </ScrollView>

            <PrimaryButton 
              label="Analyze Symptoms"
              onPress={handleNextStep}
              style={{ marginHorizontal: SPACING.xl, marginBottom: SPACING.xl }}
            />
          </View>
        )}

        {activeStep === 'RESULTS' && (
          <ScrollView
            style={styles.resultsScroll}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Triage Summary */}
            {selectedCount > 0 && <SeverityGauge memory={memory} />}
            <TriageCard result={triageResult} />
            {triageResult && (
              <NextStepCard
                riskCategory={triageResult.riskCategory}
                triageAdvice={triageResult.triageAdvice}
              />
            )}
            
            {/* 2. Patient-friendly Symptoms + Context Summary */}
            <PatientSymptomSummary assessments={assessments} />
            
            {/* 3. Patient-friendly Trace */}
            <AuditTrailView auditTrail={auditTrail} showTechnicalToggle={false} />
            
            {/* 4. Safety Disclaimer */}
            <Disclaimer />

            {/* 5. Start New Assessment */}
            <PrimaryButton 
              label="Start New Assessment"
              onPress={handleResetAssessment}
              iconName="rotate-ccw"
              style={{ marginTop: SPACING.xl, marginBottom: SPACING.xxxl }}
            />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  centred: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    color: COLORS.brandNavy,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.weight.semibold,
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  homeBtn: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.md,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.pill,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
    shadowOpacity: 0.05,
  },
  homeBtnHovered: {
    backgroundColor: '#F8FAFC',
  },
  homeBtnPressed: {
    backgroundColor: '#F8FAFC',
    transform: [{ scale: 0.94 }],
  },
  content: {
    flex: 1,
  },
  symptomsContent: {
    flex: 1,
  },
  counterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  counterText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.brandGreen,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  // ── Loading / Error ───────────────────────────────────────────────────────
  loadingText: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  errorIcon: {
    fontSize: 36,
    color: COLORS.warning,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.textPrimary,
  },
  errorBody: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.xxl,
    lineHeight: 20,
  },
  formTitle: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    color: COLORS.brandNavy,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  backBtn: {
    position: 'absolute',
    left: SPACING.lg,
    bottom: SPACING.md,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.pill,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
    shadowOpacity: 0.05,
  },
  nextButton: {
    backgroundColor: COLORS.brandGreen,
    margin: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.borderLight,
    opacity: 0.5,
  },
  nextButtonText: {
    color: COLORS.bgSurface,
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
  }
});




