import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuditTrailEntry } from '../engine/types';
import Accordion from './ui/Accordion';
import { getFactLabel } from '../constants/factLabels';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../theme/tokens';

interface AuditTrailViewProps {
  auditTrail: AuditTrailEntry[];
  showTechnicalToggle?: boolean; // If false, never show the technical toggle (used for patient flow)
}

export default function AuditTrailView({ auditTrail, showTechnicalToggle = false }: AuditTrailViewProps) {
  const [showTechnical, setShowTechnical] = useState(false);

  if (auditTrail.length === 0) return null;

  const activatedRules   = auditTrail.filter(e => e.type === 'RULE_FIRED');
  const derivedFacts     = auditTrail.filter(e => e.type === 'FACT_DERIVED');

  // Derived facts with approved translations (unknown = omit from patient view)
  const translatedFacts = derivedFacts
    .map(entry => {
      const fact = (entry as any).fact as string;
      const label = getFactLabel(fact);
      return { entry, fact, label };
    })
    .filter(item => item.label !== null); // Unknown facts excluded from patient view

  const rawRuleIds = activatedRules.map(e => (e as any).ruleId as string);
  const rawFacts   = derivedFacts.map(e => `${(e as any).fact} = ${String((e as any).value)}`);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeading}>How we reached this result</Text>

      {/* Section: What the assessment considered */}
      <Accordion title="What the assessment considered" icon="layers" defaultExpanded={true}>
        {activatedRules.length === 0 ? (
          <Text style={styles.emptyText}>No clinical patterns matched your reported symptoms.</Text>
        ) : (
          <View style={styles.row}>
            <Feather name="check-circle" size={15} color={COLORS.brandGreen} style={styles.icon} />
            <Text style={styles.rowText}>
              We compared your symptoms and context against{' '}
              <Text style={styles.rowTextBold}>
                {activatedRules.length} clinical safety guideline{activatedRules.length !== 1 ? 's' : ''}
              </Text>
              {' '}in our medical knowledge base.
            </Text>
          </View>
        )}
      </Accordion>

      {/* Section: Why this result was reached */}
      {translatedFacts.length > 0 && (
        <Accordion title="Why this result was reached" icon="activity" defaultExpanded={true}>
          <Text style={[styles.rowText, { marginBottom: SPACING.md }]}>
            Based on the guidelines, we identified the following clinical indicators:
          </Text>
          {translatedFacts.map(({ entry, label }) => (
            <View key={entry.id} style={styles.row}>
              <Feather name="arrow-right" size={15} color={COLORS.brandCyan} style={styles.icon} />
              <Text style={styles.rowText}>{label}</Text>
            </View>
          ))}
        </Accordion>
      )}

      {/* Technical details (opt-in, disabled in patient view if false) */}
      {showTechnicalToggle && (
        <>
          <Pressable
            style={styles.technicalToggle}
            onPress={() => setShowTechnical(prev => !prev)}
            accessibilityRole="button"
          >
            <Text style={styles.technicalToggleText}>
              {showTechnical ? '▲ Hide technical trace' : '▼ Show technical trace'}
            </Text>
          </Pressable>

          {showTechnical && (
            <View style={styles.technicalBox}>
              <Text style={styles.technicalLabel}>RULE IDs FIRED</Text>
              {rawRuleIds.length === 0 ? (
                <Text style={styles.technicalValue}>None</Text>
              ) : (
                rawRuleIds.map((id, i) => (
                  <Text key={i} style={styles.technicalValue}>{id}</Text>
                ))
              )}
              {rawFacts.length > 0 && (
                <>
                  <Text style={[styles.technicalLabel, { marginTop: SPACING.sm }]}>DERIVED FACTS</Text>
                  {rawFacts.map((f, i) => (
                    <Text key={i} style={styles.technicalValue}>{f}</Text>
                  ))}
                </>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.lg,
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
  emptyText: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingTop: SPACING.md,
    fontSize: TYPOGRAPHY.size.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  icon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  rowText: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weight.medium,
    flex: 1,
    lineHeight: 22,
  },
  rowTextBold: {
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
  },
  technicalToggle: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  technicalToggleText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.weight.bold,
    textTransform: 'uppercase',
  },
  technicalBox: {
    backgroundColor: COLORS.brandNavy,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    marginTop: SPACING.sm,
  },
  technicalLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.brandCyan,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
  },
  technicalValue: {
    fontSize: TYPOGRAPHY.size.sm,
    color: '#A5F3FC',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    marginBottom: SPACING.xs,
  },
});
