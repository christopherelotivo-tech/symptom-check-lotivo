import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { TriageResult } from '../engine/types';

// ---------------------------------------------------------------------------
// Risk-level configuration table
// ---------------------------------------------------------------------------

type RiskCategory = 'Green' | 'Amber' | 'Red';

interface RiskConfig {
  /** Unicode symbol rendered as the primary icon. */
  icon: string;
  /** Short status label shown below the icon. */
  label: string;
  /** Card background colour. */
  cardBg: string;
  /** Icon circle background colour. */
  iconBg: string;
  /** Primary text colour used for advice. */
  textColor: string;
  /** Accent colour for the left border stripe and labels. */
  accent: string;
  /** Subtle background for the detail / audit section. */
  detailBg: string;
}

const RISK_CONFIG: Record<RiskCategory, RiskConfig> = {
  Green: {
    icon:      '✓',
    label:     'Low Risk / Self-Care',
    cardBg:    '#ECFDF5', // Prompt hex fill
    iconBg:    '#10B981', // Prompt hex fill
    textColor: '#10B981', // Prompt hex
    accent:    '#10B981',
    detailBg:  'rgba(16, 185, 129, 0.05)',
  },
  Amber: {
    icon:      '!',
    label:     'Moderate / Consult GP',
    cardBg:    '#FFFBEB', // Prompt hex fill
    iconBg:    '#F59E0B',
    textColor: '#F59E0B',
    accent:    '#F59E0B',
    detailBg:  'rgba(245, 158, 11, 0.05)',
  },
  Red: {
    icon:      '✕',
    label:     'Critical / Emergency',
    cardBg:    '#FEF2F2', // Prompt hex fill
    iconBg:    '#EF4444',
    textColor: '#EF4444',
    accent:    '#EF4444',
    detailBg:  'rgba(239, 68, 68, 0.05)',
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TriageCardProps {
  /**
   * The structured result produced by the inference engine and transformed
   * by the parent screen. When null the card renders a neutral "no result" state.
   */
  result: TriageResult | null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Neutral placeholder shown before the user submits any symptoms. */
function EmptyState() {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconCircle}>
        <Text style={emptyStyles.icon}>?</Text>
      </View>
      <Text style={emptyStyles.title}>No evaluation yet</Text>
      <Text style={emptyStyles.subtitle}>
        Toggle your symptoms above and tap Evaluate to see your triage result.
      </Text>
    </View>
  );
}

/** Fired-rules audit trail list. */
function AuditTrail({ firedRuleIds }: { firedRuleIds: string[] }) {
  if (firedRuleIds.length === 0) return null;

  return (
    <View style={auditStyles.container}>
      <Text style={auditStyles.heading}>Rules Activated</Text>
      {firedRuleIds.map((ruleId, index) => (
        <View key={ruleId} style={auditStyles.row}>
          <Text style={auditStyles.index}>{index + 1}.</Text>
          <Text style={auditStyles.ruleId}>{ruleId}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * TriageCard displays the inference engine's evaluation output.
 *
 * - Applies medical colour coding: Green / Amber / Red.
 * - Shows a clear icon and status label for each risk level.
 * - Lists the fired rule IDs for transparency and explainability.
 * - Fully passive — receives `result` prop, renders, nothing more.
 */
export default function TriageCard({ result }: TriageCardProps) {
  if (!result) {
    return (
      <View style={styles.wrapper}>
        <EmptyState />
      </View>
    );
  }

  const config = RISK_CONFIG[result.riskCategory];

  return (
    <ScrollView
      style={[styles.card, { backgroundColor: config.cardBg, borderColor: config.accent }]}
      contentContainerStyle={styles.cardContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <View style={styles.header}>
        {/* Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: config.iconBg }]}>
          <Text style={[styles.icon, { color: config.accent }]}>
            {config.icon}
          </Text>
        </View>

        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text style={[styles.riskLabel, { color: config.accent }]}>
            {result.riskCategory.toUpperCase()} — {config.label}
          </Text>
          <Text style={[styles.riskBadge, { color: config.textColor }]}>
            Triage Result
          </Text>
        </View>
      </View>

      {/* ── Divider ─────────────────────────────────────────── */}
      <View style={[styles.divider, { backgroundColor: config.accent }]} />

      {/* ── Primary advice ──────────────────────────────────── */}
      <View style={[styles.adviceBox, { borderLeftColor: config.accent }]}>
        <Text style={[styles.adviceLabel, { color: config.accent }]}>
          RECOMMENDED ACTION
        </Text>
        <Text style={[styles.adviceText, { color: config.textColor }]}>
          {result.triageAdvice}
        </Text>
      </View>

      {/* ── Condition description ────────────────────────────── */}
      {result.description.length > 0 && (
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionLabel}>WHY AM I SEEING THIS?</Text>
          <Text style={styles.descriptionText}>{result.description}</Text>
        </View>
      )}

      {/* ── Audit trail ─────────────────────────────────────── */}
      <AuditTrail firedRuleIds={result.firedRuleIds} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
    gap: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF', // White icon on solid colored circle
  },
  titleBlock: {
    flex: 1,
  },
  riskLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  riskBadge: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B', // Darker text for readability
  },

  // Divider
  divider: {
    height: 1,
    opacity: 0.2,
  },

  // Advice box
  adviceBox: {
    paddingLeft: 16,
    borderLeftWidth: 4,
  },
  adviceLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  adviceText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
    lineHeight: 24,
  },

  // Description box
  descriptionBox: {
    borderRadius: 12,
    padding: 16,
  },
  descriptionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
});

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 30,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 19,
  },
});

const auditStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  heading: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  index: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    width: 20,
  },
  ruleId: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
});
