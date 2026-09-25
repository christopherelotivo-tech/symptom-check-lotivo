/**
 * SymptaCare — PrivacyBadge Component
 * Communicates offline/local behavior to the patient.
 * Only makes claims verified by the actual implementation.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme/tokens';

export default function PrivacyBadge() {
  return (
    <View style={styles.container}>
      <Feather name="lock" size={12} color={COLORS.brandBlue} style={styles.icon} />
      <Text style={styles.text}>Your assessment stays on this device</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.bgSurface2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.borderBrand,
    alignSelf: 'center',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.brandBlue,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
});


