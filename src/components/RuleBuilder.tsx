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
  const [consequentFact, setConsequentFact] = useState('');
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
    setConsequentFact('');
    setConsequentValue(true);
    setPriority('10');
    setRiskCategory('Green');
    setTriageAdvice('');
    setDescription('');
  };

  const handleSaveRule = async () => {
    // Basic structural validation
    if (!ruleId.trim()) return Alert.alert('Error', 'Rule ID is required.');
    if (antecedents.some(a => !a.fact.trim())) return Alert.alert('Error', 'All IF conditions must have a fact name.');
    if (!consequentFact.trim()) return Alert.alert('Error', 'THEN fact is required.');
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

        {/* 1. Rule ID */}
        <View style={styles.section}>
          <Text style={styles.label}>Rule ID (Unique identifier)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., SEVERE_FEVER_RISK"
            value={ruleId}
            onChangeText={setRuleId}
            autoCapitalize="characters"
          />
        </View>

        {/* 2. Antecedents (IF) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IF (Conditions)</Text>
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

              <Text style={styles.label}>Fact Name (e.g., fever)</Text>
              <TextInput
                style={styles.input}
                placeholder="Fact key..."
                value={cond.fact}
                onChangeText={val => handleUpdateCondition(index, { fact: val })}
                autoCapitalize="none"
              />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Operator</Text>
                  <SegmentedControl
                    options={[
                      { label: '==', value: 'EQUALS' },
                      { label: '!=', value: 'NOT_EQUALS' },
                    ]}
                    value={cond.operator}
                    onChange={val => handleUpdateCondition(index, { operator: val })}
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Value</Text>
                  <SegmentedControl
                    options={[
                      { label: 'TRUE', value: true },
                      { label: 'FALSE', value: false },
                    ]}
                    value={cond.value}
                    onChange={val => handleUpdateCondition(index, { value: val })}
                  />
                </View>
              </View>
            </View>
          ))}
          <Pressable style={styles.addButton} onPress={handleAddCondition}>
            <Text style={styles.addButtonText}>+ Add Condition (AND)</Text>
          </Pressable>
        </View>

        {/* 3. Consequent (THEN) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THEN (Derived Fact)</Text>
          <View style={styles.thenCard}>
            <Text style={styles.label}>Derived Fact Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., possible_infection"
              value={consequentFact}
              onChangeText={setConsequentFact}
              autoCapitalize="none"
            />
            <Text style={styles.label}>Assigned Value</Text>
            <SegmentedControl
              options={[
                { label: 'TRUE', value: true },
                { label: 'FALSE', value: false },
              ]}
              value={consequentValue}
              onChange={setConsequentValue}
            />
          </View>
        </View>

        {/* 4. Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action Payload (Metadata)</Text>
          
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.label}>Priority Score</Text>
              <TextInput
                style={styles.input}
                placeholder="10"
                keyboardType="numeric"
                value={priority}
                onChangeText={setPriority}
              />
            </View>
          </View>

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

          <Text style={[styles.label, { marginTop: 12 }]}>Triage Advice Template</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Advice to show the user..."
            multiline
            value={triageAdvice}
            onChangeText={setTriageAdvice}
          />

          <Text style={styles.label}>Internal Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Why does this rule exist?"
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <Pressable style={styles.saveButton} onPress={handleSaveRule}>
          <Text style={styles.saveButtonText}>Save Rule</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const COLORS = {
  background: '#F0FDF4', // Soft mint to match app bg
  card: '#FFFFFF',
  border: '#D1FAE5',
  primary: '#10B981', // Emerald
  text: '#064E3B', // Deep forest green
  muted: '#64748B',
  danger: '#EF4444',
  segmentBg: '#ECFDF5',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  conditionCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  thenCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  conditionBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Segmented Control Styles
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.segmentBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    overflow: 'hidden',
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentFirst: {
  },
  segmentLast: {
  },
  segmentButtonActive: {
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  segmentTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
