import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import {
  AuditTrailEntry,
  UserInputAuditEntry,
  RuleFiredAuditEntry,
  FactDerivedAuditEntry,
} from '../engine/types';

// Enable LayoutAnimation on Android (required; iOS has it by default).
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditTrailViewProps {
  /** The full audit trail produced by InferenceEngine.evaluate(). */
  auditTrail: AuditTrailEntry[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a Unix timestamp (ms) as HH:MM:SS. */
function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Convert a snake_case fact key to a readable label. */
function formatFact(fact: string): string {
  return fact
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Smooth accordion toggle animation config. */
function triggerAnimation() {
  LayoutAnimation.configureNext({
    duration: 250,
    create: { type: 'easeInEaseOut', property: 'opacity' },
    update: { type: 'easeInEaseOut' },
    delete: { type: 'easeInEaseOut', property: 'opacity' },
  });
}

// ---------------------------------------------------------------------------
// Section sub-component
// ---------------------------------------------------------------------------

interface SectionProps {
  title: string;
  badge: number;
  badgeColor: string;
  icon: string;
  children: React.ReactNode;
  /** Whether the section starts collapsed. */
  defaultCollapsed?: boolean;
}

function Section({
  title,
  badge,
  badgeColor,
  icon,
  children,
  defaultCollapsed = false,
}: SectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggle = () => {
    triggerAnimation();
    setCollapsed(prev => !prev);
  };

  return (
    <View style={sectionStyles.wrapper}>
      {/* Section header */}
      <Pressable
        style={({ pressed }) => [
          sectionStyles.header,
          pressed && sectionStyles.headerPressed,
        ]}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: !collapsed }}
        accessibilityLabel={`${title} section, ${badge} item${badge !== 1 ? 's' : ''}`}
      >
        <Text style={sectionStyles.icon}>{icon}</Text>
        <Text style={sectionStyles.title}>{title}</Text>

        {/* Item count badge */}
        <View style={[sectionStyles.badge, { backgroundColor: badgeColor }]}>
          <Text style={sectionStyles.badgeText}>{badge}</Text>
        </View>

        {/* Chevron */}
        <Text style={sectionStyles.chevron}>{collapsed ? '›' : '⌄'}</Text>
      </Pressable>

      {/* Section body */}
      {!collapsed && (
        <View style={sectionStyles.body}>
          {children}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Row sub-components
// ---------------------------------------------------------------------------

function InputRow({ entry }: { entry: UserInputAuditEntry }) {
  return (
    <View style={rowStyles.row}>
      {/* Timeline dot */}
      <View style={styles.timelineColumn}>
        <View style={[rowStyles.dot, { backgroundColor: COLORS.inputDot }]} />
        <View style={rowStyles.line} />
      </View>

      <View style={rowStyles.content}>
        <View style={rowStyles.topRow}>
          <Text style={[rowStyles.tag, { color: COLORS.inputAccent, backgroundColor: COLORS.inputBg }]}>
            INPUT
          </Text>
          <Text style={rowStyles.time}>{formatTime(entry.timestamp)}</Text>
        </View>
        <Text style={rowStyles.primary}>{formatFact(entry.fact)}</Text>
        <Text style={[rowStyles.secondary, { color: entry.value ? COLORS.inputAccent : COLORS.mutedText }]}>
          → {entry.value ? 'Present' : 'Absent'}
        </Text>
      </View>
    </View>
  );
}

function RuleRow({ entry, index }: { entry: RuleFiredAuditEntry; index: number }) {
  return (
    <View style={rowStyles.row}>
      <View style={styles.timelineColumn}>
        <View style={[rowStyles.dot, { backgroundColor: COLORS.ruleAccent }]}>
          <Text style={rowStyles.dotIndex}>{index + 1}</Text>
        </View>
        <View style={rowStyles.line} />
      </View>

      <View style={rowStyles.content}>
        <View style={rowStyles.topRow}>
          <Text style={[rowStyles.tag, { color: COLORS.ruleAccent, backgroundColor: COLORS.ruleBg }]}>
            RULE FIRED
          </Text>
          <Text style={rowStyles.time}>{formatTime(entry.timestamp)}</Text>
        </View>
        <Text style={rowStyles.primary} numberOfLines={2}>{entry.ruleId}</Text>
      </View>
    </View>
  );
}

function DerivedRow({ entry }: { entry: FactDerivedAuditEntry }) {
  return (
    <View style={rowStyles.row}>
      <View style={styles.timelineColumn}>
        <View style={[rowStyles.dot, { backgroundColor: COLORS.derivedDot }]} />
        <View style={rowStyles.line} />
      </View>

      <View style={rowStyles.content}>
        <View style={rowStyles.topRow}>
          <Text style={[rowStyles.tag, { color: COLORS.derivedAccent, backgroundColor: COLORS.derivedBg }]}>
            DERIVED
          </Text>
          <Text style={rowStyles.time}>{formatTime(entry.timestamp)}</Text>
        </View>
        <Text style={rowStyles.primary}>{formatFact(entry.fact)}</Text>
        <Text style={rowStyles.secondary}>
          via <Text style={rowStyles.sourceRule}>{entry.sourceRuleId}</Text>
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyAuditState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>⋯</Text>
      <Text style={styles.emptyText}>
        No audit trail yet. Run an evaluation to see the execution trace.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * AuditTrailView renders the full execution trajectory of the inference
 * engine as a collapsible accordion card.
 *
 * Three independently expandable sections:
 *   1. User Inputs    — symptoms the patient reported
 *   2. Rules Fired    — ordered sequence of rules that matched
 *   3. Derived Facts  — intermediate facts inferred at each pass
 */
export default function AuditTrailView({ auditTrail }: AuditTrailViewProps) {
  const [masterExpanded, setMasterExpanded] = useState(true);

  const inputs  = auditTrail.filter((e): e is UserInputAuditEntry  => e.type === 'USER_INPUT');
  const fired   = auditTrail.filter((e): e is RuleFiredAuditEntry  => e.type === 'RULE_FIRED');
  const derived = auditTrail.filter((e): e is FactDerivedAuditEntry => e.type === 'FACT_DERIVED');

  const toggleMaster = () => {
    triggerAnimation();
    setMasterExpanded(prev => !prev);
  };

  return (
    <View style={styles.card}>

      {/* ── Master header ──────────────────────────────────── */}
      <Pressable
        style={({ pressed }) => [styles.masterHeader, pressed && styles.masterHeaderPressed]}
        onPress={toggleMaster}
        accessibilityRole="button"
        accessibilityState={{ expanded: masterExpanded }}
        accessibilityLabel="Audit Trail accordion"
      >
        <View style={styles.masterTitleRow}>
          <Text style={styles.masterIcon}>◈</Text>
          <View>
            <Text style={styles.masterTitle}>Execution Trace</Text>
            <Text style={styles.masterSubtitle}>
              {auditTrail.length === 0
                ? 'No entries'
                : `${inputs.length} input${inputs.length !== 1 ? 's' : ''} · ${fired.length} rule${fired.length !== 1 ? 's' : ''} · ${derived.length} derived`}
            </Text>
          </View>
        </View>
        <Text style={styles.masterChevron}>{masterExpanded ? '⌃' : '⌄'}</Text>
      </Pressable>

      {/* ── Expanded body ──────────────────────────────────── */}
      {masterExpanded && (
        <View style={styles.masterBody}>
          {auditTrail.length === 0 ? (
            <EmptyAuditState />
          ) : (
            <>
              {/* 1. User Inputs */}
              <Section
                title="Symptoms Reported"
                icon="👤"
                badge={inputs.length}
                badgeColor={COLORS.inputAccent}
                defaultCollapsed={false}
              >
                {inputs.length === 0 ? (
                  <Text style={styles.sectionEmpty}>No inputs recorded.</Text>
                ) : (
                  inputs.map(entry => <InputRow key={entry.id} entry={entry} />)
                )}
              </Section>

              <View style={styles.sectionDivider} />

              {/* 2. Rules Fired */}
              <Section
                title="Rules Activated"
                icon="⚡"
                badge={fired.length}
                badgeColor={COLORS.ruleAccent}
                defaultCollapsed={false}
              >
                {fired.length === 0 ? (
                  <Text style={styles.sectionEmpty}>No rules fired.</Text>
                ) : (
                  fired.map((entry, i) => <RuleRow key={entry.id} entry={entry} index={i} />)
                )}
              </Section>

              <View style={styles.sectionDivider} />

              {/* 3. Derived Facts */}
              <Section
                title="Derived Facts"
                icon="🔗"
                badge={derived.length}
                badgeColor={COLORS.derivedAccent}
                defaultCollapsed={true}
              >
                {derived.length === 0 ? (
                  <Text style={styles.sectionEmpty}>No facts were inferred.</Text>
                ) : (
                  derived.map(entry => <DerivedRow key={entry.id} entry={entry} />)
                )}
              </Section>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const COLORS = {
  cardBg:          '#FFFFFF',
  cardBorder:      '#E2E8F0',
  masterHeaderBg:  '#FFFFFF',
  masterHeaderBdr: '#E2E8F0',
  textPrimary:     '#0F172A',
  textSecondary:   '#64748B',

  // Section styling
  sectionBg:       '#F8FAFC',
  sectionBorder:   '#E2E8F0',

  // Category specific
  inputBg:         '#F1F5F9',
  inputAccent:     '#475569',
  inputDot:        '#94A3B8',

  ruleBg:          '#FFF7ED', // Soft Orange
  ruleAccent:      '#EA580C',
  
  derivedBg:       '#EFF6FF', // Soft Blue
  derivedAccent:   '#2563EB',
  derivedDot:      '#93C5FD',

  timelineLine:    '#E2E8F0',
  mutedText:       '#94A3B8',

  // Compatibility tokens
  card:            '#FFFFFF',
  border:          '#E2E8F0',
  bodyText:        '#0F172A',
  lineColor:       '#E2E8F0',
  timeText:        '#64748B',
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },

  // Master header
  masterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.masterHeaderBg,
  },
  masterHeaderPressed: {
    opacity: 0.7,
  },
  masterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  masterIcon: {
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  masterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  masterSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  masterChevron: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  masterBody: {
    padding: 16,
    backgroundColor: COLORS.sectionBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },

  // Section helpers
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  sectionEmpty: {
    fontSize: 13,
    color: COLORS.mutedText,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontStyle: 'italic',
  },

  // Timeline column
  timelineColumn: {
    width: 28,
    alignItems: 'center',
    marginRight: 10,
  },

  // Empty state
  emptyState: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 28,
    color: COLORS.mutedText,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.mutedText,
    textAlign: 'center',
    lineHeight: 19,
  },
});

const sectionStyles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: COLORS.card,
  },
  headerPressed: {
    backgroundColor: '#F9FAFB',
  },
  icon: {
    fontSize: 15,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.bodyText,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chevron: {
    fontSize: 16,
    color: COLORS.mutedText,
    fontWeight: '600',
    marginLeft: 4,
  },
  body: {
    paddingTop: 4,
    paddingBottom: 8,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dotIndex: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.lineColor,
    marginTop: 3,
    minHeight: 18,
  },
  content: {
    flex: 1,
    paddingBottom: 8,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  tag: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  time: {
    fontSize: 10,
    color: COLORS.timeText,
    fontVariant: ['tabular-nums'],
  },
  primary: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.bodyText,
    fontFamily: 'monospace',
  },
  secondary: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  sourceRule: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: COLORS.derivedAccent,
  },
});

