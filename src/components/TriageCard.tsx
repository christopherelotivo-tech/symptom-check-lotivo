import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TriageResult } from '../engine/types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme/tokens';

interface TriageCardProps {
  result: TriageResult | null;
}

// ---------------------------------------------------------------------------
// Triage config: system label + human pairing + visual treatment
// triageAdvice and description text come from rule metadata — DO NOT CHANGE
// ---------------------------------------------------------------------------

const TRIAGE_CONFIG = {
  Green: {
    systemLabel:   'GREEN',
    humanPairing:  'Low concern',
    icon:          'check-circle' as const,
    iconColor:     COLORS.triageGreenIcon,
    textColor:     COLORS.triageGreenText,
    bgColor:       COLORS.triageGreenBg,
    borderColor:   COLORS.triageGreenBorder,
  },
  Amber: {
    systemLabel:   'AMBER',
    humanPairing:  'Consider medical advice',
    icon:          'alert-circle' as const,
    iconColor:     COLORS.triageAmberIcon,
    textColor:     COLORS.triageAmberText,
    bgColor:       COLORS.triageAmberBg,
    borderColor:   COLORS.triageAmberBorder,
  },
  Red: {
    systemLabel:   'RED',
    humanPairing:  'Seek urgent medical care',
    icon:          'alert-triangle' as const,
    iconColor:     COLORS.triageRedIcon,
    textColor:     COLORS.triageRedText,
    bgColor:       COLORS.triageRedBg,
    borderColor:   COLORS.triageRedBorder,
  },
};

export default function TriageCard({ result }: TriageCardProps) {

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!result) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <Feather name="clipboard" size={40} color={COLORS.textMuted} style={{ marginBottom: SPACING.base }} />
        <Text style={styles.emptyTitle}>Your result will appear here</Text>
        <Text style={styles.emptySubtitle}>
          Go back and select any symptoms you're currently experiencing.
        </Text>
      </View>
    );
  }

  const { riskCategory, triageAdvice, description } = result;
  const config = TRIAGE_CONFIG[riskCategory] ?? TRIAGE_CONFIG.Green;

  return (
    <View style={[styles.card, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>

      {/* ── Status header: system label + human pairing ── */}
      <View style={styles.statusRow}>
        <Feather name={config.icon} size={28} color={config.iconColor} />
        <View style={styles.statusText}>
          <Text style={[styles.systemLabel, { color: config.iconColor }]}>
            {config.systemLabel}
          </Text>
          <Text style={[styles.humanPairing, { color: config.textColor }]}>
            {config.humanPairing}
          </Text>
        </View>
      </View>

      {/* ── Description from rule metadata (unchanged) ── */}
      {description ? (
        <View style={[styles.descriptionBox, { borderTopColor: config.borderColor }]}>
          <Text style={[styles.description, { color: config.textColor }]}>
            {description}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
    ...SHADOW.md,
    shadowOpacity: 0.05,
  },
  emptyCard: {
    backgroundColor: COLORS.bgSurface,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.base,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
    gap: SPACING.md,
  },
  statusText: {
    flex: 1,
  },
  systemLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  humanPairing: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    letterSpacing: -0.5,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
  },
  descriptionBox: {
    paddingTop: SPACING.base,
    opacity: 0.85,
  },
  description: {
    fontSize: TYPOGRAPHY.size.base,
    lineHeight: 22,
    fontWeight: TYPOGRAPHY.weight.regular,
  },
});
