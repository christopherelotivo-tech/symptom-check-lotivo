import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { WorkingMemory } from '../engine/types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme/tokens';

interface SeverityGaugeProps {
  memory: WorkingMemory;
}

export default function SeverityGauge({ memory }: SeverityGaugeProps) {
  const [fillAnim] = useState(new Animated.Value(0));

  // ── Computation (DO NOT TOUCH) ────────────────────────────────────────────
  let score = 0;
  for (const key in memory) {
    if (memory[key].value) {
      score += memory[key].weight || 0;
    }
  }
  const visualScore = Math.min(score, 1.0);
  // ─────────────────────────────────────────────────────────────────────────

  // Threshold labels and colors (unchanged logic)
  let barColor = COLORS.triageGreenIcon;
  let thresholdLabel = 'Low';
  if (score >= 1.0) {
    barColor = COLORS.triageRedIcon;
    thresholdLabel = 'High';
  } else if (score >= 0.5) {
    barColor = COLORS.triageAmberIcon;
    thresholdLabel = 'Moderate';
  }

  const selectedCount = Object.values(memory).filter(f => f.value).length;

  useEffect(() => {
    Animated.spring(fillAnim, {
      toValue: visualScore,
      useNativeDriver: false,
    }).start();
  }, [visualScore]);

  const widthInterpolation = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Symptom Intensity</Text>
          <Text style={styles.context}>
            Based on {selectedCount} symptom{selectedCount !== 1 ? 's' : ''} you reported
          </Text>
        </View>
        <Text style={[styles.thresholdBadge, { color: barColor }]}>
          {thresholdLabel}
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, { width: widthInterpolation, backgroundColor: barColor }]}
        />
        <View style={[styles.marker, { left: '50%' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.base,
    ...SHADOW.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  context: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  thresholdBadge: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  track: {
    height: 8,
    backgroundColor: COLORS.bgSurface2,
    borderRadius: RADIUS.pill,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  marker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: COLORS.bgSurface,
    opacity: 0.6,
  },
});
