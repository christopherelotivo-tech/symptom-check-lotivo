import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme/tokens';
import { SymptomAssessment } from '../utils/ContextMapper';
import { DURATION_OPTIONS, SEVERITY_OPTIONS } from '../utils/ContextConfig';
import { Feather } from '@expo/vector-icons';
import { getSymptomLabel } from './SymptomForm';

interface PatientSymptomSummaryProps {
  assessments: Record<string, SymptomAssessment>;
}

export default function PatientSymptomSummary({ assessments }: PatientSymptomSummaryProps) {
  const activeAssessments = Object.values(assessments).filter(a => a.active);

  if (activeAssessments.length === 0) return null;

  const getDurationLabel = (code: string) => DURATION_OPTIONS.find(o => o.value === code)?.label || code;
  const getSeverityLabel = (code: string) => SEVERITY_OPTIONS.find(o => o.value === code)?.shortLabel || code;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeading}>Your Symptoms</Text>
      
      <View style={styles.card}>
        {activeAssessments.map((a, index) => (
          <View key={a.factKey} style={[styles.symptomRow, index > 0 && styles.symptomDivider]}>
            <View style={styles.symptomHeader}>
              <Feather name="check" size={16} color={COLORS.brandGreen} style={styles.icon} />
              <Text style={styles.symptomTitle}>{getSymptomLabel(a.factKey)}</Text>
            </View>
            
            {(a.durationCode || a.severityCode) && (
              <View style={styles.contextBox}>
                {a.durationCode && (
                  <Text style={styles.contextText}>
                    <Text style={styles.contextLabel}>Duration: </Text>
                    {getDurationLabel(a.durationCode)}
                  </Text>
                )}
                {a.severityCode && (
                  <Text style={styles.contextText}>
                    <Text style={styles.contextLabel}>Severity: </Text>
                    {getSeverityLabel(a.severityCode)}
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    color: COLORS.brandNavy,
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
  },
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 108, 0.04)',
    ...SHADOW.md,
    shadowOpacity: 0.04,
  },
  symptomRow: {
    paddingVertical: SPACING.md,
  },
  symptomDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 58, 108, 0.04)',
  },
  symptomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  symptomTitle: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
  },
  contextBox: {
    marginTop: SPACING.xs,
    marginLeft: SPACING.xl + 4,
  },
  contextText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  contextLabel: {
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.brandBlue,
  },
});
