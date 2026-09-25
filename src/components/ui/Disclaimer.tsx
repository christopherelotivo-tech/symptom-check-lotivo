/**
 * ArayKo! — Disclaimer Component
 * Medical disclaimer for the patient result experience.
 * Does not overstate clinical capabilities.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme/tokens';

export default function Disclaimer() {
  return (
    <View style={styles.container}>
      <Feather name="info" size={14} color={COLORS.textMuted} style={styles.icon} />
      <Text style={styles.text}>
        ArayKo! provides a structured symptom assessment and is{' '}
        <Text style={styles.bold}>not a medical diagnosis.</Text>
        {' '}If you are concerned about your health or your symptoms worsen,
        please consult a qualified healthcare professional.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 108, 0.04)',
    marginTop: SPACING.sm,
  },
  icon: {
    marginRight: SPACING.sm,
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  bold: {
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.textSecondary,
  },
});

