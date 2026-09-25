/**
 * SymptaCare — NextStepCard Component
 *
 * Presents the existing triageAdvice data with action-oriented visual
 * hierarchy. Does NOT duplicate the text verbatim or invent new advice.
 *
 * Data source: triageAdvice from existing rule metadata (unchanged).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../../theme/tokens';

interface NextStepCardProps {
  riskCategory: 'Green' | 'Amber' | 'Red';
  triageAdvice: string;
}

const STEP_CONFIG = {
  Green: {
    icon:       'heart'    as const,
    iconColor:  COLORS.triageGreenText,
    bgColor:    '#F0FDF4',
    borderColor:'#86EFAC',
    label:      'What to do now',
  },
  Amber: {
    icon:       'phone'    as const,
    iconColor:  COLORS.triageAmberText,
    bgColor:    '#FFFBEB',
    borderColor:'#FCD34D',
    label:      'What to do now',
  },
  Red: {
    icon:       'alert-triangle' as const,
    iconColor:  COLORS.triageRedText,
    bgColor:    '#FFF1F2',
    borderColor:'#FDA4AF',
    label:      'Act now',
  },
};

export default function NextStepCard({ riskCategory, triageAdvice }: NextStepCardProps) {
  const config = STEP_CONFIG[riskCategory] ?? STEP_CONFIG.Green;

  return (
    <View style={[styles.card, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
      <View style={styles.header}>
        <View style={[styles.iconCircle, { borderColor: config.borderColor }]}>
          <Feather name={config.icon} size={18} color={config.iconColor} />
        </View>
        <Text style={[styles.label, { color: config.iconColor }]}>{config.label}</Text>
      </View>
      <Text style={[styles.advice, { color: config.iconColor }]}>{triageAdvice}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    padding: SPACING.xl,
    ...SHADOW.md,
    shadowOpacity: 0.04,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  advice: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.medium,
    lineHeight: 22,
  },
});


