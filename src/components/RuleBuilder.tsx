import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { addCustomRule, getAllRules } from '../database/DatabaseService';
import { RuleValidator } from '../engine/RuleValidator';
import { Rule, RuleCondition } from '../engine/types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme/tokens';
import ClinicalFactSelector from './ui/ClinicalFactSelector';
import PrimaryButton from './ui/PrimaryButton';

// ---------------------------------------------------------------------------
// Reusable UI Components
// ---------------------------------------------------------------------------

function SegmentedControl<T extends string | boolean | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <View style={styles.segmentContainer}>
      {options.map((opt, i) => {
        const isActive = value === opt.value;
        const isFirst = i === 0;
        const isLast = i === options.length - 1;
        return (
          <Pressable
            key={String(opt.value)}
            style={[
              styles.segmentButton,
              isActive && styles.segmentButtonActive,
              isFirst && styles.segmentFirst,
              isLast && styles.segmentLast,
            ]}
            onPress={() => onChange(opt.value)}
          >
            <Text
              style={[
                styles.segmentText,
                isActive && styles.segmentTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function RuleBuilder({ onRuleSaved }: { onRuleSaved?: () => void }) {
  const [existingRules, setExistingRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [description, setDescription] = useState('');
  const [riskCategory, setRiskCategory] = useState<'Green' | 'Amber' | 'Red'>('Green');
  
  // Categorized Advice
  const [selfCareAdvice, setSelfCareAdvice] = useState('');
  const [medicationAdvice, setMedicationAdvice] = useState('');
  const [escalationTrigger, setEscalationTrigger] = useState('');

  const [antecedents, setAntecedents] = useState<RuleCondition[]>([
    { fact: '', operator: 'EQUALS', value: true },
  ]);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const rules = await getAllRules();
      setExistingRules(rules);
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCondition = () => {
    setAntecedents(prev => [
      ...prev,
      { fact: '', operator: 'EQUALS', value: true },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    setAntecedents(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCondition = (index: number, updates: Partial<RuleCondition>) => {
    setAntecedents(prev =>
      prev.map((cond, i) => (i === index ? { ...cond, ...updates } : cond))
    );
  };

  const resetForm = () => {
    setDescription('');
    setRiskCategory('Green');
    setSelfCareAdvice('');
    setMedicationAdvice('');
    setEscalationTrigger('');
    setAntecedents([{ fact: '', operator: 'EQUALS', value: true }]);
  };

  const handleSaveRule = async () => {
    if (!description.trim()) {
      return Alert.alert('Validation Error', 'Please provide a Rule Title.');
    }
    
    // Validate conditions
    for (const cond of antecedents) {
      if (!cond.fact) {
        return Alert.alert('Validation Error', 'All conditions must have a selected symptom.');
      }
    }

    // Auto-generate ID and Priority
    const autoId = 'CP_' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const autoPriority = riskCategory === 'Red' ? 100 : riskCategory === 'Amber' ? 60 : 20;
    const autoConsequent = description.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Compile triageAdvice fallback
    const triageAdviceParts = [];
    if (selfCareAdvice) triageAdviceParts.push(`Self-Care: ${selfCareAdvice}`);
    if (medicationAdvice) triageAdviceParts.push(`Medication: ${medicationAdvice}`);
    if (escalationTrigger) triageAdviceParts.push(`Escalation Trigger: ${escalationTrigger}`);
    const fallbackAdvice = triageAdviceParts.length > 0 ? triageAdviceParts.join('\n\n') : 'No specific advice provided.';

    const candidateRule: Rule = {
      id: autoId,
      antecedents: antecedents.map(a => ({
        ...a,
        fact: a.fact.trim().toLowerCase().replace(/\s+/g, '_'),
      })),
      consequent: { fact: autoConsequent, value: true },
      metadata: {
        priority: autoPriority,
        riskCategory,
        triageAdvice: fallbackAdvice,
        selfCareAdvice: selfCareAdvice.trim(),
        medicationAdvice: medicationAdvice.trim(),
        escalationTrigger: escalationTrigger.trim(),
        description: description.trim(),
      },
    };

    // Run custom rule validator (duplicates & circular dependencies)
    const validation = RuleValidator.validate(candidateRule, existingRules);
    
    if (!validation.isValid) {
      return Alert.alert('Validation Error', validation.errors.join('\n\n'));
    }

    try {
      await addCustomRule(candidateRule);
      Alert.alert('Success', 'Protocol saved successfully!');
      resetForm();
      loadRules(); // Refresh existing rules for future validation
      if (onRuleSaved) onRuleSaved();
    } catch (error) {
      Alert.alert('Database Error', 'Failed to save the protocol.');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading Rule Engine...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Protocol Builder</Text>
        <Text style={styles.headerSub}>Create new clinical triage protocols.</Text>

        {/* 1. Protocol Definition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Protocol Definition</Text>
          <Text style={styles.label}>Protocol Name (Short Title)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Tension Headache"
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Triage Urgency Tier</Text>
          <SegmentedControl
            options={[
              { label: '🟢 Low Concern', value: 'Green' },
              { label: '🟡 Doctor Consult', value: 'Amber' },
              { label: '🔴 Emergency', value: 'Red' },
            ]}
            value={riskCategory}
            onChange={setRiskCategory}
          />
        </View>

        {/* 2. Clinical Advice Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Advice</Text>
          
          <Text style={styles.label}>Self-Care Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Rest in a quiet environment, maintain hydration..."
            multiline
            value={selfCareAdvice}
            onChangeText={setSelfCareAdvice}
          />

          <Text style={styles.label}>Medication Guidelines</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Over-the-counter pain relief (acetaminophen)..."
            multiline
            value={medicationAdvice}
            onChangeText={setMedicationAdvice}
          />

          <Text style={styles.label}>Escalation Triggers</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Consult physician if symptoms persist beyond 48 hours..."
            multiline
            value={escalationTrigger}
            onChangeText={setEscalationTrigger}
          />
        </View>

        {/* 3. Clinical Triggers (Conditions) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Symptom Conditions</Text>
          
          <Text style={styles.label}>Trigger this protocol when...</Text>
          {antecedents.map((cond, index) => (
            <View key={index} style={styles.conditionCard}>
              <View style={styles.conditionHeader}>
                <Text style={styles.conditionBadge}>Condition {index + 1}</Text>
                {antecedents.length > 1 && (
                  <Pressable onPress={() => handleRemoveCondition(index)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                )}
              </View>

              <ClinicalFactSelector
                value={cond.fact}
                onChange={val => handleUpdateCondition(index, { fact: val })}
              />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Status</Text>
                  <SegmentedControl
                    options={[
                      { label: 'Is Present', value: 'present' },
                      { label: 'Is Absent', value: 'absent' },
                    ]}
                    value={cond.operator === 'EQUALS' && cond.value === false ? 'absent' : 'present'}
                    onChange={val => {
                      if (val === 'present') {
                        handleUpdateCondition(index, { operator: 'EQUALS', value: true });
                      } else {
                        handleUpdateCondition(index, { operator: 'EQUALS', value: false });
                      }
                    }}
                  />
                </View>
              </View>
            </View>
          ))}
          <Pressable style={styles.addButton} onPress={handleAddCondition}>
            <Text style={styles.addButtonText}>+ Add Condition</Text>
          </Pressable>
        </View>

        <PrimaryButton label="Save Protocol" onPress={handleSaveRule} iconName="save" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: 80,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    color: COLORS.brandNavy,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.brandBlue,
    fontWeight: TYPOGRAPHY.weight.semibold,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
  },
  label: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  conditionCard: {
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 108, 0.04)',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOW.md,
    shadowOpacity: 0.04,
  },
  thenCard: {
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 108, 0.04)',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOW.md,
    shadowOpacity: 0.04,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  conditionBadge: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.brandBlue,
    backgroundColor: COLORS.bgPrimary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  removeText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  flex1: {
    flex: 1,
  },
  addButton: {
    backgroundColor: COLORS.bgPrimary,
    borderWidth: 1,
    borderColor: COLORS.brandBlue,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: COLORS.brandBlue,
    fontWeight: TYPOGRAPHY.weight.bold,
    fontSize: TYPOGRAPHY.size.sm,
  },
  saveButton: {
    backgroundColor: COLORS.brandGreen,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOW.md,
  },
  saveButtonPressed: {
    backgroundColor: COLORS.brandGreenDark,
  },
  saveButtonText: {
    color: COLORS.textOnGreen,
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    letterSpacing: 0.5,
  },

  // Segmented Control Styles
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSurface2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  segmentFirst: {
  },
  segmentLast: {
  },
  segmentButtonActive: {
    backgroundColor: COLORS.bgSurface,
    ...SHADOW.sm,
  },
  segmentText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.textMuted,
  },
  segmentTextActive: {
    color: COLORS.brandNavy,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  hintText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
});
