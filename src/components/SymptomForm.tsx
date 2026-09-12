import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { WorkingMemory } from '../engine/types';

// ---------------------------------------------------------------------------
// Data model — strictly declarative, zero medical logic
// ---------------------------------------------------------------------------

interface SymptomItem {
  /** The Working Memory key — must match rule antecedent fact names exactly. */
  factKey: string;
  /** Human-readable label shown next to the switch. */
  label: string;
}

interface SymptomCategory {
  title: string;
  symptoms: SymptomItem[];
}

/**
 * The full symptom catalogue, organised into display categories.
 *
 * Keys must exactly match the fact names used in seedRules.json.
 * No conditional or medical evaluation logic lives here.
 */
const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    title: '🫁 Respiratory',
    symptoms: [
      { factKey: 'shortness_of_breath', label: 'Shortness of Breath' },
      { factKey: 'cough',               label: 'Cough' },
      { factKey: 'wheezing',            label: 'Wheezing' },
      { factKey: 'chest_pain',          label: 'Chest Pain' },
    ],
  },
  {
    title: '🩺 Systemic',
    symptoms: [
      { factKey: 'fever',    label: 'Fever' },
      { factKey: 'fatigue',  label: 'Fatigue' },
      { factKey: 'nausea',   label: 'Nausea' },
      { factKey: 'vomiting', label: 'Vomiting' },
    ],
  },
  {
    title: '🧠 Neurological',
    symptoms: [
      { factKey: 'headache',   label: 'Headache' },
      { factKey: 'stiff_neck', label: 'Stiff Neck' },
      { factKey: 'dizziness',  label: 'Dizziness' },
      { factKey: 'confusion',  label: 'Confusion' },
    ],
  },
  {
    title: '🩹 Dermatological',
    symptoms: [
      { factKey: 'rash',     label: 'Rash' },
      { factKey: 'swelling', label: 'Swelling' },
      { factKey: 'jaundice', label: 'Jaundice (Yellowing)' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SymptomFormProps {
  /**
   * The current Working Memory state. The parent component owns this state —
   * SymptomForm is strictly a controlled, passive view.
   */
  memory: WorkingMemory;

  /**
   * Called whenever the user toggles a symptom switch.
   * Receives the fact key and the new boolean value so the parent can
   * write directly into Working Memory: `{ ...memory, [fact]: value }`.
   */
  onToggle: (fact: string, value: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * SymptomForm renders symptoms grouped by clinical category.
 *
 * Design principles:
 * - **Passive**: no medical evaluation, no inference, no conditional logic.
 * - **Controlled**: all state lives in the parent via `memory` + `onToggle`.
 * - **Flat updates**: each toggle writes a single boolean fact key directly
 *   into Working Memory, ready for the InferenceEngine to evaluate.
 */
export default function SymptomForm({ memory, onToggle }: SymptomFormProps) {
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.formTitle}>How are you feeling?</Text>
      <Text style={styles.formSubtitle}>
        Toggle any symptoms you are currently experiencing.
      </Text>

      {SYMPTOM_CATEGORIES.map(category => (
        <View key={category.title} style={styles.categoryCard}>
          {/* Category header */}
          <View style={styles.categoryHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </View>
          </View>

          {/* Symptom rows */}
          {category.symptoms.map((symptom, index) => {
            const isActive = memory[symptom.factKey] === true;
            const isLast   = index === category.symptoms.length - 1;

            return (
              <View
                key={symptom.factKey}
                style={[styles.symptomRow, isLast && styles.symptomRowLast]}
              >
                <Text style={[styles.symptomLabel, isActive && styles.symptomLabelActive]}>
                  {symptom.label}
                </Text>
                <Switch
                  value={isActive}
                  onValueChange={(newValue: boolean) =>
                    onToggle(symptom.factKey, newValue)
                  }
                  trackColor={{ false: COLORS.trackOff, true: COLORS.trackOn }}
                  thumbColor={isActive ? COLORS.thumbOn : COLORS.thumbOff}
                  ios_backgroundColor={COLORS.trackOff}
                  accessibilityLabel={symptom.label}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: isActive }}
                />
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const COLORS = {
  background:       '#F8FAFC', // Soft off-white/zinc canvas
  card:             '#FFFFFF',
  border:           '#E2E8F0',
  title:            '#0F172A',
  subtitle:         '#64748B',
  badgeText:        '#334155', // Darker text for cleaner look
  labelDefault:     '#334155',
  labelActive:      '#0F172A',
  trackOff:         '#E2E8F0',
  trackOn:          '#10B981', // Clean green for toggles
  thumbOff:         '#FFFFFF',
  thumbOn:          '#FFFFFF',
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 20,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.title,
    marginBottom: 4,
    fontFamily: 'System',
  },
  formSubtitle: {
    fontSize: 15,
    color: COLORS.subtitle,
    marginBottom: 12,
    lineHeight: 22,
    fontFamily: 'System',
  },

  // Modern Elevated White Card Container
  categoryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  categoryBadge: {
    // We remove the tinted pill bg for a cleaner minimalist text-only or subtle look
    paddingHorizontal: 4,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.badgeText,
    letterSpacing: 0.5,
    fontFamily: 'System',
  },

  // Symptom rows
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  symptomRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 16,
  },
  symptomLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.labelDefault,
    flex: 1,
    marginRight: 12,
    fontFamily: 'System',
  },
  symptomLabelActive: {
    fontWeight: '700',
    color: COLORS.labelActive,
  },
});
