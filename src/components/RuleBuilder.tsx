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
  const [ruleId, setRuleId] = useState('');
  const [antecedents, setAntecedents] = useState<RuleCondition[]>([
    { fact: '', operator: 'EQUALS', value: true },
  ]);
  const [consequentFact, setConsequentFact] = useState('triage_green');
  const [consequentValue, setConsequentValue] = useState(true);

  const [priority, setPriority] = useState('10');
  const [riskCategory, setRiskCategory] = useState<'Green' | 'Amber' | 'Red'>('Green');
  const [triageAdvice, setTriageAdvice] = useState('');
  const [description, setDescription] = useState('');

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
    setRuleId('');
    setAntecedents([{ fact: '', operator: 'EQUALS', value: true }]);
    setConsequentFact('triage_green');
    setConsequentValue(true);
    setPriority('10');
    setRiskCategory('Green');
    setTriageAdvice('');
    setDescription('');
  };

  const handleSaveRule = async () => {
    // Basic structural validation
    if (!ruleId.trim()) return Alert.alert('Error', 'Rule ID is required.');
    if (antecedents.some(a => !a.fact.trim())) return Alert.alert('Error', 'All When... conditions must have an observation name.');
    if (!consequentFact.trim()) return Alert.alert('Error', 'Clinical Conclusion is required.');
    if (!triageAdvice.trim()) return Alert.alert('Error', 'Triage Advice is required.');
    if (isNaN(Number(priority))) return Alert.alert('Error', 'Priority must be a valid number.');

    const candidateRule: Rule = {
      id: ruleId.trim().toUpperCase().replace(/\s+/g, '_'),
      antecedents: antecedents.map(a => ({
        ...a,
        fact: a.fact.trim().toLowerCase().replace(/\s+/g, '_'),
      })),
      consequent: {
        fact: consequentFact.trim().toLowerCase().replace(/\s+/g, '_'),
        value: consequentValue,
      },
      metadata: {
        priority: parseInt(priority, 10),
        riskCategory,
        triageAdvice: triageAdvice.trim(),
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
      Alert.alert('Success', 'Rule saved successfully!');
      resetForm();
      loadRules(); // Refresh existing rules for future validation
      if (onRuleSaved) onRuleSaved();
    } catch (error) {
      Alert.alert('Database Error', 'Failed to save the rule to the database.');
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Rule Builder</Text>
        <Text style={styles.headerSub}>
          Create new clinical inference rules.
        </Text>

        {/* 1. Clinical Definition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Definition</Text>
          <Text style={styles.label}>Internal Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Severe Respiratory Assessment"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Risk Category</Text>
          <SegmentedControl
            options={[
              { label: '🟢 Green', value: 'Green' },
              { label: '🟡 Amber', value: 'Amber' },
              { label: '🔴 Red', value: 'Red' },
            ]}
            value={riskCategory}
            onChange={setRiskCategory}
          />

          <Text style={[styles.label, { marginTop: SPACING.md }]}>Triage Advice</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Advice to show the user..."
            multiline
            value={triageAdvice}
            onChangeText={setTriageAdvice}
          />
        </View>

        {/* 2. Clinical Triggers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Triggers</Text>
          
          <Text style={styles.label}>When...</Text>
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
                      { label: 'Is present', value: 'present' },
                      { label: 'Is absent', value: 'absent' },
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

          <Text style={[styles.label, { marginTop: SPACING.xl }]}>Clinical Conclusion</Text>
          <View style={styles.thenCard}>
            <Text style={styles.hintText}>
              What should the engine conclude when ALL conditions above are met?
            </Text>
            <SegmentedControl
              options={[
                { label: '🟢 Low Concern', value: 'triage_green' },
                { label: '🟡 See a Doctor', value: 'triage_amber' },
                { label: '🔴 Emergency', value: 'triage_red' },
              ]}
              value={consequentFact || 'triage_green'}
              onChange={(val) => setConsequentFact(String(val))}
            />
          </View>
        </View>

        {/* 3. System Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Configuration (Advanced)</Text>
          
          <Text style={styles.label}>System Rule ID</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., SEVERE_FEVER_RISK"
            value={ruleId}
            onChangeText={setRuleId}
            autoCapitalize="characters"
          />
          
          <Text style={styles.label}>Priority Score</Text>
          <TextInput
            style={styles.input}
            placeholder="10"
            keyboardType="numeric"
            value={priority}
            onChangeText={setPriority}
          />
        </View>

        <PrimaryButton
          label="Save Guideline"
          onPress={handleSaveRule}
          iconName="save"
        />
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
    backgroundColor: COLORS.bgPrimary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: 40,
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
