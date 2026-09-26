import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { TriageResult, AuditTrailEntry, Rule } from '../engine/types';
import { SymptomAssessment } from '../utils/ContextMapper';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme/tokens';

interface AssessmentReportProps {
  triageResult: TriageResult;
  assessments: Record<string, SymptomAssessment>;
  auditTrail?: AuditTrailEntry[];
  rules?: Rule[];
  onStartNew: () => void;
  onShowHistory?: () => void;
  onClose: () => void;
}

// ── Per-risk configurations ───────────────────────────────────────────────────
const RISK_CONFIG = {
  Red: {
    gradientColors: ['#1a0000', '#3D0000', '#7F1D1D'] as [string, string, string],
    accentColor: '#EF4444',
    labelText: 'MEDICAL EMERGENCY',
    urgencyLabel: '⚠️  URGENT!',
    ctaText: '🚨  CALL 911 NOW',
    ctaColor: '#EF4444',
    ctaBg: 'white',
    themeCard: {
      emoji: '🚑',
      title: 'Please Call 911',
      subtitle: 'This is a life-threatening emergency. Call emergency services immediately.',
      bg: '#7F1D1D',
      border: '#EF4444',
    },
  },
  Amber: {
    gradientColors: ['#F0F7FF', '#FFF8E8', '#E8FAEF'] as [string, string, string],
    accentColor: '#F59E0B',
    labelText: 'Needs Medical Advice',
    urgencyLabel: 'See a Doctor',
    ctaText: 'Consult a Doctor',
    ctaColor: '#F59E0B',
    ctaBg: '#F59E0B',
    themeCard: {
      emoji: '👨‍⚕️',
      title: 'Visit a Clinic',
      subtitle: 'Please see a healthcare professional soon. Do not ignore these symptoms.',
      bg: '#FFFBEB',
      border: '#FCD34D',
    },
  },
  Green: {
    gradientColors: ['#F0F7FF', '#E8FAEF', '#F0FDF4'] as [string, string, string],
    accentColor: '#10B981',
    labelText: 'Home Care Appropriate',
    urgencyLabel: 'You\'re okay!',
    ctaText: 'Rest at Home',
    ctaColor: '#10B981',
    ctaBg: '#10B981',
    themeCard: {
      emoji: '🏠',
      title: 'Rest at Home',
      subtitle: 'Your symptoms are manageable at home. Stay hydrated, rest well, and monitor for changes.',
      bg: '#F0FDF4',
      border: '#A7F3D0',
    },
  },
};

export default function AssessmentReport({
  triageResult,
  assessments,
  auditTrail = [] as AuditTrailEntry[],
  rules = [] as Rule[],
  onStartNew,
  onShowHistory,
  onClose,
}: AssessmentReportProps) {
  const insets = useSafeAreaInsets();
  const [symptomsExpanded, setSymptomsExpanded] = useState(false);
  const [causesExpanded, setCausesExpanded] = useState(false);
  const [whyExpanded, setWhyExpanded] = useState(false);

  const config = RISK_CONFIG[triageResult.riskCategory] || RISK_CONFIG.Green;
  const symptomList = Object.values(assessments);
  const isRed = triageResult.riskCategory === 'Red';
  const isAmber = triageResult.riskCategory === 'Amber';
  const isGreen = triageResult.riskCategory === 'Green';

  // Compute primary and secondary fired rules
  const primaryRuleId = triageResult.firedRuleIds[0];
  const ruleMap = useMemo(() => new Map(rules.map(r => [r.id, r])), [rules]);
  const primaryRule = primaryRuleId ? ruleMap.get(primaryRuleId) : undefined;
  
  const secondaryRules = useMemo(() => {
    return triageResult.firedRuleIds
      .filter(id => id !== primaryRuleId)
      .map(id => ruleMap.get(id))
      .filter((r): r is Rule => r !== undefined);
  }, [ruleMap, triageResult.firedRuleIds, primaryRuleId]);

  return (
    <LinearGradient
      colors={config.gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>

        {/* ── HEADER ── */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + SPACING.sm,
              backgroundColor: isRed ? 'rgba(0,0,0,0.5)' : 'white',
              borderBottomColor: isRed ? '#7F1D1D' : COLORS.borderLight,
            },
          ]}
        >
          <View>
            <Text style={[styles.headerTitle, { color: isRed ? 'white' : COLORS.brandNavy }]}>SymptaCare</Text>
            <Text style={[styles.headerSub, { color: isRed ? '#FCA5A5' : COLORS.brandBlue, marginTop: 3 }]}>
              Assessment Report
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={[styles.iconButton, { backgroundColor: isRed ? 'rgba(255,255,255,0.15)' : COLORS.bgSurface2 }]}
          >
            <Feather name="home" size={20} color={isRed ? 'white' : COLORS.brandNavy} />
          </Pressable>
        </View>

        {/* ── SCROLLABLE BODY ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl }}
          showsVerticalScrollIndicator={false}
        >

          {/* ══ RED: BIG URGENT HEADER ══ */}
          {isRed && (
            <View style={styles.urgentBlock}>
              <Text style={styles.urgentTag}>{config.urgencyLabel}</Text>
              <Text style={styles.urgentDescription}>{triageResult.description || 'Critical condition detected'}</Text>
              
              {triageResult.selfCareAdvice || triageResult.medicationAdvice || triageResult.escalationTrigger ? (
                <View style={styles.categorizedAdviceBox}>
                  {triageResult.selfCareAdvice && (
                    <Text style={styles.urgentAdviceText}><Text style={{fontWeight: 'bold'}}>Self-Care:</Text> {triageResult.selfCareAdvice}</Text>
                  )}
                  {triageResult.medicationAdvice && (
                    <Text style={styles.urgentAdviceText}><Text style={{fontWeight: 'bold'}}>Medication:</Text> {triageResult.medicationAdvice}</Text>
                  )}
                  {triageResult.escalationTrigger && (
                    <Text style={styles.urgentAdviceText}><Text style={{fontWeight: 'bold'}}>Escalation:</Text> {triageResult.escalationTrigger}</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.urgentAdvice}>{triageResult.triageAdvice}</Text>
              )}
            </View>
          )}

          {/* ══ AMBER / GREEN: BOLD STATUS HEADER ══ */}
          {!isRed && (
            <View style={[styles.statusBanner, { 
              borderColor: config.accentColor,
              backgroundColor: isGreen ? '#F0FDF4' : '#FFFBEB',
            }]}>
              {/* Big status text — the key message */}
              <Text style={[styles.statusEmphasis, { color: config.accentColor }]}>
                {isAmber ? '⚠️  See a Doctor' : '✅  You\'re Okay!'}
              </Text>
              <Text style={[styles.statusDescription, { color: COLORS.textPrimary }]}>
                {triageResult.description || 'Assessment Complete'}
              </Text>

              {triageResult.selfCareAdvice || triageResult.medicationAdvice || triageResult.escalationTrigger ? (
                <View style={styles.categorizedAdviceBoxNormal}>
                  {triageResult.selfCareAdvice && (
                    <Text style={styles.normalAdviceText}><Text style={{fontWeight: 'bold', color: COLORS.brandNavy}}>Self-Care:</Text> {triageResult.selfCareAdvice}</Text>
                  )}
                  {triageResult.medicationAdvice && (
                    <Text style={styles.normalAdviceText}><Text style={{fontWeight: 'bold', color: COLORS.brandNavy}}>Medication:</Text> {triageResult.medicationAdvice}</Text>
                  )}
                  {triageResult.escalationTrigger && (
                    <Text style={styles.normalAdviceText}><Text style={{fontWeight: 'bold', color: '#D97706'}}>⚠ Escalation:</Text> {triageResult.escalationTrigger}</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.normalAdvice}>{triageResult.triageAdvice}</Text>
              )}
            </View>
          )}

          {/* ══ THEME ACTION CARD (Ambulance / Doctor / Home) ══ */}
          <View style={[styles.themeCard, { backgroundColor: config.themeCard.bg, borderColor: config.themeCard.border }]}>
            <Text style={[styles.themeCardEmoji, { color: isRed ? 'white' : COLORS.textPrimary }]}>
              {config.themeCard.emoji}
            </Text>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={[styles.themeCardTitle, { color: isRed ? 'white' : COLORS.brandNavy }]}>
                {config.themeCard.title}
              </Text>
              <Text style={[styles.themeCardSubtitle, { color: isRed ? '#FCA5A5' : COLORS.textSecondary }]}>
                {config.themeCard.subtitle}
              </Text>
            </View>
          </View>

          {/* ══ CTA BUTTON ══ */}
          {isRed ? (
            <Pressable style={styles.redCtaButton} onPress={() => Linking.openURL('tel:911')}>
              <Text style={styles.redCtaText}>{config.ctaText}</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.normalCtaButton, { backgroundColor: config.ctaBg }]}>
              <Text style={styles.normalCtaText}>{config.ctaText}</Text>
            </Pressable>
          )}

          {/* ── RISK ICON ROW ── */}
          <View style={styles.riskRow}>
            <View style={[styles.riskBadge, isRed && styles.riskBadgeActive]}>
              <Text style={styles.riskBadgeEmoji}>🚑</Text>
              <Text style={[styles.riskBadgeLabel, isRed && { color: '#EF4444', fontWeight: '800' }]}>Emergency</Text>
            </View>
            <View style={[styles.riskBadge, isAmber && styles.riskBadgeActive]}>
              <Text style={styles.riskBadgeEmoji}>👨‍⚕️</Text>
              <Text style={[styles.riskBadgeLabel, isAmber && { color: '#F59E0B', fontWeight: '800' }]}>See Doctor</Text>
            </View>
            <View style={[styles.riskBadge, isGreen && styles.riskBadgeActive]}>
              <Text style={styles.riskBadgeEmoji}>🏠</Text>
              <Text style={[styles.riskBadgeLabel, isGreen && { color: '#10B981', fontWeight: '800' }]}>Home Care</Text>
            </View>
          </View>

          {/* ── ACCORDION: Why This Result? (Audit Trail) ── */}
          {primaryRule && (
            <Pressable
              style={[styles.accordionCard, isRed && styles.accordionCardDark, { marginBottom: SPACING.md }]}
              onPress={() => setWhyExpanded(!whyExpanded)}
            >
              <View style={styles.accordionHeader}>
                <View style={styles.accordionIcon}>
                  <Text style={{ fontSize: 18 }}>🤔</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.accordionTitle, isRed && { color: 'white' }]}>
                    Why This Result?
                  </Text>
                  <Text style={[styles.accordionSub, isRed && { color: '#FCA5A5' }]}>
                    See how your symptoms were evaluated.
                  </Text>
                </View>
                <Feather
                  name={whyExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={isRed ? 'white' : COLORS.textPrimary}
                />
              </View>
              {whyExpanded && (
                <View style={[styles.accordionContent, isRed && { borderTopColor: 'rgba(255,255,255,0.1)' }]}>
                  <Text style={[styles.whyTitleText, isRed && { color: 'white' }]}>Matched Condition:</Text>
                  <Text style={[styles.whyDescText, isRed && { color: '#FEE2E2' }]}>{primaryRule.metadata.description || primaryRule.id}</Text>
                  
                  <Text style={[styles.whyTitleText, isRed && { color: 'white' }, { marginTop: SPACING.md }]}>Required Symptoms Detected:</Text>
                  <View style={styles.whySymptomList}>
                    {primaryRule.antecedents.map((ant, idx) => {
                      const isPositive = ant.value === true;
                      return (
                        <View key={idx} style={[styles.whySymptomPill, isPositive ? styles.whySymptomPositive : styles.whySymptomNegative]}>
                          <Feather name={isPositive ? "check" : "x"} size={14} color={isPositive ? "#059669" : "#DC2626"} style={{ marginRight: 4 }} />
                          <Text style={[styles.whySymptomText, { color: isPositive ? "#059669" : "#DC2626" }]}>
                            {ant.fact.replace(/_/g, ' ')} {isPositive ? '(Reported)' : '(Absent)'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </Pressable>
          )}

          {/* ── ACCORDION: Less likely causes ── */}
          <Pressable
            style={[styles.accordionCard, isRed && styles.accordionCardDark]}
            onPress={() => setCausesExpanded(!causesExpanded)}
          >
            <View style={styles.accordionHeader}>
              <View style={styles.accordionIcon}>
                <Feather name="git-branch" size={18} color={isRed ? '#FCA5A5' : '#059669'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.accordionTitle, isRed && { color: 'white' }]}>
                  Other conditions that matched ({secondaryRules.length})
                </Text>
                <Text style={[styles.accordionSub, isRed && { color: '#FCA5A5' }]}>
                  Additional rules that also fired during your assessment.
                </Text>
              </View>
              <Feather
                name={causesExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={isRed ? 'white' : COLORS.textPrimary}
              />
            </View>
            {causesExpanded && (
              <View style={[styles.accordionContent, isRed && { borderTopColor: '#7F1D1D' }]}>
                {secondaryRules.length === 0 ? (
                  <Text style={[styles.accordionBodyText, isRed && { color: '#FCA5A5' }]}>
                    No other conditions matched. Your symptoms are very specific to the primary result above.
                  </Text>
                ) : (
                  secondaryRules.map((rule, idx) => (
                    <View key={rule.id} style={[styles.secondaryRuleRow, idx < secondaryRules.length - 1 && { borderBottomWidth: 1, borderBottomColor: isRed ? '#7F1D1D' : COLORS.borderLight }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <View style={[styles.riskDot, { backgroundColor: rule.metadata.riskCategory === 'Red' ? '#EF4444' : rule.metadata.riskCategory === 'Amber' ? '#F59E0B' : '#10B981' }]} />
                        <Text style={[styles.secondaryRuleTitle, isRed && { color: 'white' }]}>
                          {rule.metadata.description}
                        </Text>
                      </View>
                      <Text style={[styles.secondaryRuleAdvice, isRed && { color: '#FCA5A5' }]}>
                        {rule.metadata.triageAdvice}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </Pressable>

          {/* ── ACCORDION: Symptoms reported ── */}
          <Pressable
            style={[styles.accordionCard, isRed && styles.accordionCardDark]}
            onPress={() => setSymptomsExpanded(!symptomsExpanded)}
          >
            <View style={styles.accordionHeader}>
              <View style={styles.accordionIcon}>
                <Feather name="list" size={18} color={isRed ? '#FCA5A5' : '#0EA5E9'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.accordionTitle, isRed && { color: 'white' }]}>Symptoms you reported</Text>
                <Text style={[styles.accordionSub, isRed && { color: '#FCA5A5' }]}>Review the symptoms you told us about.</Text>
              </View>
              <Feather
                name={symptomsExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={isRed ? 'white' : COLORS.textPrimary}
              />
            </View>
            {symptomsExpanded && (
              <View style={[styles.accordionContent, isRed && { borderTopColor: '#7F1D1D' }]}>
                {symptomList.length === 0 ? (
                  <Text style={[styles.accordionBodyText, isRed && { color: '#FCA5A5' }]}>No symptoms were reported.</Text>
                ) : (
                  symptomList.map((sym, idx) => (
                    <View key={idx} style={styles.symptomRow}>
                      <Text style={[styles.symptomName, isRed && { color: 'white' }]}>
                        • {sym.factKey.replace(/_/g, ' ')}
                      </Text>
                      {sym.durationCode && (
                        <Text style={[styles.symptomDetail, isRed && { color: '#FCA5A5' }]}>Duration: {sym.durationCode}</Text>
                      )}
                      {sym.severityCode && (
                        <Text style={[styles.symptomDetail, isRed && { color: '#FCA5A5' }]}>Severity: {sym.severityCode}</Text>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}
          </Pressable>

          {/* History link */}
          {onShowHistory && (
            <Pressable onPress={onShowHistory} style={styles.historyLink}>
              <Feather name="clock" size={16} color={isRed ? '#FCA5A5' : COLORS.brandNavy} />
              <Text style={[styles.historyLinkText, isRed && { color: '#FCA5A5' }]}>  View Assessment History</Text>
            </Pressable>
          )}
        </ScrollView>

        {/* ── STICKY BOTTOM: Start New Assessment ── */}
        <View
          style={[
            styles.stickyBottom,
            {
              paddingBottom: insets.bottom + SPACING.md,
              backgroundColor: isRed ? 'rgba(0,0,0,0.6)' : 'white',
              borderTopColor: isRed ? '#7F1D1D' : COLORS.borderLight,
            },
          ]}
        >
          <Pressable
            style={[styles.startNewButton, { backgroundColor: isRed ? '#EF4444' : COLORS.brandNavy }]}
            onPress={onStartNew}
          >
            <Feather name="refresh-cw" size={16} color="white" style={{ marginRight: SPACING.sm }} />
            <Text style={styles.startNewButtonText}>Start New Assessment</Text>
          </Pressable>
        </View>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    ...SHADOW.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Red urgent block
  urgentBlock: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  urgentTag: {
    fontSize: 40,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: -1,
    marginBottom: SPACING.sm,
  },
  urgentDescription: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    lineHeight: 32,
    marginBottom: SPACING.md,
  },
  urgentAdvice: {
    fontSize: 16,
    color: '#FCA5A5',
    lineHeight: 24,
  },

  // ── Amber / Green top status banner
  statusBanner: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    ...SHADOW.sm,
  },
  statusEmphasis: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  statusDescription: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  normalAdvice: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  topCardIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },

  // ── Theme action card (ambulance / doctor / home)
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
  },
  themeCardEmoji: {
    fontSize: 36,
  },
  themeCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  themeCardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },

  // ── CTAs
  redCtaButton: {
    backgroundColor: '#EF4444',
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  redCtaText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  normalCtaButton: {
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  normalCtaText: {
    color: 'white',
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: '700',
  },

  // ── Risk icon row
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.xl,
  },
  riskBadge: {
    alignItems: 'center',
    opacity: 0.4,
  },
  riskBadgeActive: {
    opacity: 1,
  },
  riskBadgeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  riskBadgeLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // ── Accordions
  accordionCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  accordionCardDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionIcon: {
    marginRight: SPACING.md,
  },
  accordionTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
    color: COLORS.brandNavy,
  },
  accordionSub: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  accordionContent: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  accordionBodyText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  symptomRow: {
    marginBottom: SPACING.md,
  },
  symptomName: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  symptomDetail: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    marginLeft: 10,
  },

  // ── Why This Result
  whyTitleText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  whyDescText: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: '700',
    color: COLORS.brandNavy,
    marginBottom: SPACING.sm,
  },
  whySymptomList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  whySymptomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  whySymptomPositive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  whySymptomNegative: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  whySymptomText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // ── Secondary rules
  secondaryRuleRow: {
    paddingVertical: SPACING.md,
  },
  secondaryRuleTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    color: COLORS.brandNavy,
    flex: 1,
  },
  secondaryRuleAdvice: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginLeft: SPACING.lg,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },

  // ── History link
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  historyLinkText: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.brandNavy,
    fontWeight: '700',
  },

  // ── Sticky bottom
  stickyBottom: {
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderTopWidth: 1,
  },
  startNewButton: {
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startNewButtonText: {
    color: 'white',
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: '700',
  },
  categorizedAdviceBox: {
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  urgentAdviceText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: '#FEE2E2',
    lineHeight: 20,
    marginBottom: 4,
  },
  categorizedAdviceBoxNormal: {
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  normalAdviceText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
});
