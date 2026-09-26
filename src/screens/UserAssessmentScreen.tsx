import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  LayoutAnimation,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

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
import { saveAssessmentHistory } from '../services/HistoryService';
// ─────────────────────────────────────────────────────────────────────────────

import SymptomForm, { SYMPTOM_CATEGORIES } from '../components/SymptomForm';
import BottomNav      from '../components/BottomNav';
import SymptomContextCard from '../components/SymptomContextCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import LoadingState from '../components/ui/LoadingState';
import AssessmentReport from '../components/AssessmentReport';
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

  const ruleMap = new Map(rules.map(r => [r.id, r]));

  const primaryRule = firedRuleIds
    .map(id => ruleMap.get(id))
    .filter((r): r is Rule => r !== undefined)
    .sort((a, b) => {
      const riskDiff =
        (RISK_RANK[b.metadata.riskCategory] ?? 0) -
        (RISK_RANK[a.metadata.riskCategory] ?? 0);
      if (riskDiff !== 0) return riskDiff;
      const prioDiff = b.metadata.priority - a.metadata.priority;
      if (prioDiff !== 0) return prioDiff;
      // If same risk and priority, the more specific rule (more conditions) wins!
      return b.antecedents.length - a.antecedents.length;
    })[0];

  // If we have an override, but no rule fired, or the rule that fired is lower risk than the override
  if (overrideEntry && (!primaryRule || (RISK_RANK[primaryRule.metadata.riskCategory] < RISK_RANK[overrideEntry.newRiskCategory]))) {
    return {
      riskCategory: overrideEntry.newRiskCategory,
      triageAdvice: primaryRule
        ? primaryRule.metadata.triageAdvice + '\n\nAdditionally, due to the high severity/number of symptoms reported, you have been automatically escalated. Please seek clinical evaluation immediately.'
        : 'We noticed a combination of severe symptoms. Please seek clinical evaluation immediately.',
      selfCareAdvice: primaryRule?.metadata.selfCareAdvice,
      medicationAdvice: primaryRule?.metadata.medicationAdvice,
      escalationTrigger: primaryRule?.metadata.escalationTrigger,
      description: primaryRule
        ? primaryRule.metadata.description + ' (Escalated to Red)'
        : 'Your combined symptoms triggered an automatic safety escalation. Please do not ignore this result.',
      firedRuleIds,
    };
  }

  // Otherwise, use the primary rule (and combine advice if multiple top-risk rules fired)
  if (primaryRule) {
    const topRiskRules = firedRuleIds
      .map(id => ruleMap.get(id))
      .filter((r): r is Rule => r !== undefined && r.metadata.riskCategory === primaryRule.metadata.riskCategory);

    const combinedAdvice = Array.from(new Set(topRiskRules.map(r => r.metadata.triageAdvice))).join('\n\n');
    const combinedDesc = Array.from(new Set(topRiskRules.map(r => r.metadata.description))).join(' + ');

    return {
      riskCategory: primaryRule.metadata.riskCategory,
      triageAdvice: combinedAdvice,
      selfCareAdvice: primaryRule.metadata.selfCareAdvice,
      medicationAdvice: primaryRule.metadata.medicationAdvice,
      escalationTrigger: primaryRule.metadata.escalationTrigger,
      description: combinedDesc,
      firedRuleIds,
    };
  }

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
  onShowHistory?: () => void;
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

export default function UserAssessmentScreen({ onSwitchToWelcome, onShowHistory }: UserAssessmentScreenProps) {
  const insets = useSafeAreaInsets();
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
        const symptomsList = Object.keys(nextMemory).filter(k => nextMemory[k].value === true);
        saveAssessmentHistory(symptomsList, triage, result.auditTrail);
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

  const goToStep = (step: WizardStep) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveStep(step);
  };

  const handleNextStep = () => {
    if (activeStep === 'SYMPTOMS') {
      const hasSymptoms = Object.values(assessments).some(a => a.active);
      if (hasSymptoms) goToStep('CONTEXT');
      else goToStep('ANALYZING');
    } else if (activeStep === 'CONTEXT') {
      goToStep('ANALYZING');
    }
  };

  const handlePrevStep = () => {
    if (activeStep === 'RESULTS') goToStep('SYMPTOMS');
    else if (activeStep === 'CONTEXT') goToStep('SYMPTOMS');
  };

  const handleResetAssessment = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
        goToStep('RESULTS');
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
    <LinearGradient colors={['#D1FAE5', '#6EE7B7']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{ flex: 1 }}>
      <View style={[styles.root, { backgroundColor: 'transparent' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        {/* ── Content ── */}
        <View style={styles.content}>
          {activeStep === 'SYMPTOMS' && (
            <>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* NEW HERO SECTION */}
              <View 
                style={{ backgroundColor: 'transparent', paddingHorizontal: SPACING.xl, paddingTop: insets.top + SPACING.sm, paddingBottom: SPACING.md }}
              >
                {/* Top Row: Titles (Left) + Home Button (Right) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.brandNavy, letterSpacing: -0.5 }}>
                      SymptaCare
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.brandBlue, fontWeight: '700' }}>
                      Symptom Check
                    </Text>
                  </View>

                  <Pressable onPress={onSwitchToWelcome} style={{ padding: SPACING.sm, marginRight: -SPACING.sm }}>
                    <Feather name="home" size={24} color={COLORS.brandNavy} />
                  </Pressable>
                </View>
              </View>

              {/* Centered Logo & Question (Floating in body) */}
              <View style={{ alignItems: 'center', paddingTop: SPACING.md, paddingBottom: SPACING.sm }}>
                <BlurView intensity={60} tint="light" style={{ padding: 6, borderRadius: 38, marginBottom: SPACING.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)' }}>
                  <Image 
                    source={require('../../assets/icons/logo.jpg')}
                    style={{ width: 90, height: 90, borderRadius: 32 }}
                  />
                </BlurView>
                <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.brandNavy, textAlign: 'center', lineHeight: 32, marginBottom: SPACING.xs, paddingHorizontal: SPACING.xxl }}>
                  What symptom is bothering you most?
                </Text>
                <Text style={{ fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SPACING.xxl }}>
                  For example, you can search 'fever' or 'headache'.
                </Text>
              </View>

            <View style={styles.symptomsContent}>
              <SymptomForm memory={memory} onToggle={handleToggle} />
            </View>
          </ScrollView>
          <View style={{ paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: Math.max(insets.bottom, SPACING.lg), backgroundColor: 'transparent' }}>
            {selectedCount === 1 && (
              <Text style={{ textAlign: 'center', color: COLORS.triageAmberIcon, fontWeight: '600', fontSize: 13, marginBottom: SPACING.sm }}>
                ⚠️  Please select at least 2 symptoms to continue
              </Text>
            )}
            <PrimaryButton 
              label="Next"
              onPress={handleNextStep}
              disabled={selectedCount < 2}
            />
          </View>
          </>
        )}

        {activeStep === 'CONTEXT' && (
          <View style={styles.symptomsContent}>
            <>
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {/* HERO SECTION */}
              <View 
                style={{ backgroundColor: 'transparent', paddingHorizontal: SPACING.xl, paddingTop: insets.top + SPACING.sm, paddingBottom: SPACING.md }}
              >
                {/* Top Row: Back (Left) + Titles (Center/Left) + Home (Right) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable onPress={handlePrevStep} style={{ padding: SPACING.sm, marginLeft: -SPACING.sm, marginRight: SPACING.sm }}>
                      <Feather name="arrow-left" size={24} color={COLORS.brandNavy} />
                    </Pressable>
                    
                    <View style={{ alignItems: 'flex-start' }}>
                      <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.brandNavy, letterSpacing: -0.5 }}>
                        SymptaCare
                      </Text>
                      <Text style={{ fontSize: 14, color: COLORS.brandBlue, fontWeight: '700' }}>
                        Symptom Check
                      </Text>
                    </View>
                  </View>

                  <Pressable onPress={onSwitchToWelcome} style={{ padding: SPACING.sm, marginRight: -SPACING.sm }}>
                    <Feather name="home" size={24} color={COLORS.brandNavy} />
                  </Pressable>
                </View>
              </View>

              {/* Centered Logo & Question (Floating in body) */}
              <View style={{ alignItems: 'center', paddingTop: SPACING.md, paddingBottom: SPACING.sm }}>
                <BlurView intensity={60} tint="light" style={{ padding: 6, borderRadius: 38, marginBottom: SPACING.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)' }}>
                  <Image 
                    source={require('../../assets/icons/logo.jpg')}
                    style={{ width: 90, height: 90, borderRadius: 32 }}
                  />
                </BlurView>
                <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.brandNavy, textAlign: 'center', lineHeight: 32, marginBottom: SPACING.xs, paddingHorizontal: SPACING.xxl }}>
                  Tell us a bit more.
                </Text>
                <Text style={{ fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SPACING.xxl }}>
                  This helps us give you a more accurate result. All questions below are optional.
                </Text>
              </View>

              <View style={{ padding: SPACING.xl, paddingBottom: SPACING.xxxl }}>

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
            </ScrollView>

            <View style={{ paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: Math.max(insets.bottom, SPACING.lg), backgroundColor: 'transparent' }}>
              <PrimaryButton 
                label="Analyze Symptoms"
                onPress={handleNextStep}
              />
            </View>
            </>
          </View>
        )}

        {activeStep === 'RESULTS' && triageResult && (
          <AssessmentReport 
            triageResult={triageResult}
            assessments={assessments}
            auditTrail={auditTrail}
            rules={rules}
            onStartNew={handleResetAssessment}
            onShowHistory={onShowHistory}
            onClose={onSwitchToWelcome}
          />
        )}
      </View>
    </View>
    </LinearGradient>
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





