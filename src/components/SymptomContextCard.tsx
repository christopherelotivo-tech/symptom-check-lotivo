import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme/tokens';
import { SymptomAssessment } from '../utils/ContextMapper';
import { CONTEXT_CONFIG, DEFAULT_CONTEXT_CONFIG, DURATION_OPTIONS, SEVERITY_OPTIONS } from '../utils/ContextConfig';
import BucketSelector from './ui/BucketSelector';

interface SymptomContextCardProps {
  factKey: string;
  symptomName: string;
  assessment: SymptomAssessment;
  onChange: (factKey: string, field: 'durationCode' | 'severityCode', value: string) => void;
}

export default function SymptomContextCard({
  factKey,
  symptomName,
  assessment,
  onChange,
}: SymptomContextCardProps) {
  const config = CONTEXT_CONFIG[factKey] || DEFAULT_CONTEXT_CONFIG;

  // If this symptom requires no context questions, don't render a card.
  if (!config.duration && !config.severity) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{symptomName}</Text>
      
      {config.duration && (
        <BucketSelector
          label="How long has this been troubling you? (Optional)"
          options={DURATION_OPTIONS}
          value={assessment.durationCode}
          onChange={(val) => onChange(factKey, 'durationCode', val)}
        />
      )}

      {config.severity && (
        <BucketSelector
          label="How would you describe the severity? (Optional)"
          options={SEVERITY_OPTIONS}
          value={assessment.severityCode}
          onChange={(val) => onChange(factKey, 'severityCode', val)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xxl,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 108, 0.04)',
    ...SHADOW.md,
    shadowOpacity: 0.04,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    color: COLORS.brandNavy,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 58, 108, 0.04)',
  }
});
