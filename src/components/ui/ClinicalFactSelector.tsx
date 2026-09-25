import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../../theme/tokens';
import { SYMPTOM_CATEGORIES } from '../SymptomForm';
import { CONTEXT_CONFIG, DEFAULT_CONTEXT_CONFIG, DURATION_OPTIONS, SEVERITY_OPTIONS, getContextFactKey } from '../../utils/ContextConfig';
import { Feather } from '@expo/vector-icons';

interface ClinicalFactSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ClinicalFactSelector({ value, onChange }: ClinicalFactSelectorProps) {
  const [isRawMode, setIsRawMode] = useState(false);
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [selectedContextType, setSelectedContextType] = useState<'base' | 'duration' | 'severity'>('base');

  const allSymptoms = SYMPTOM_CATEGORIES.flatMap(cat => cat.symptoms);
  const activeSymptomObj = allSymptoms.find(s => s.factKey === selectedSymptom);
  const activeConfig = selectedSymptom ? (CONTEXT_CONFIG[selectedSymptom] || DEFAULT_CONTEXT_CONFIG) : null;

  const handleSelectSymptom = (factKey: string) => {
    setSelectedSymptom(factKey);
    setSelectedContextType('base');
    onChange(factKey); // By default, select the base symptom
  };

  const handleSelectContextType = (type: 'base' | 'duration' | 'severity') => {
    setSelectedContextType(type);
    if (type === 'base') {
      onChange(selectedSymptom!);
    }
  };

  const handleSelectValue = (contextValue: string) => {
    if (!selectedSymptom || selectedContextType === 'base') return;
    onChange(getContextFactKey(selectedSymptom, selectedContextType, contextValue));
  };

  if (isRawMode) {
    return (
      <View>
        <View style={styles.headerRow}>
          <Text style={styles.label}>Observation Name (Raw Input)</Text>
          <Pressable onPress={() => setIsRawMode(false)}>
            <Text style={styles.toggleText}>Use Guided Builder</Text>
          </Pressable>
        </View>
        <TextInput
          style={styles.input}
          placeholder="e.g. possible_infection"
          value={value}
          onChangeText={onChange}
          autoCapitalize="none"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Observation Builder</Text>
        <Pressable onPress={() => setIsRawMode(true)}>
          <Text style={styles.toggleText}>Use Raw Input</Text>
        </Pressable>
      </View>

      {/* 1. Select Symptom */}
      <View style={styles.selectionBlock}>
        <Text style={styles.stepTitle}>1. Symptom</Text>
        <View style={styles.chipContainer}>
          {allSymptoms.map(sym => (
            <Pressable
              key={sym.factKey}
              style={[styles.chip, selectedSymptom === sym.factKey && styles.chipActive]}
              onPress={() => handleSelectSymptom(sym.factKey)}
            >
              <Text style={[styles.chipText, selectedSymptom === sym.factKey && styles.chipTextActive]}>
                {sym.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 2. Select Context (if applicable) */}
      {selectedSymptom && activeConfig && (activeConfig.duration || activeConfig.severity) && (
        <View style={styles.selectionBlock}>
          <Text style={styles.stepTitle}>2. Specific Context</Text>
          <View style={styles.chipContainer}>
            <Pressable
              style={[styles.chip, selectedContextType === 'base' && styles.chipActive]}
              onPress={() => handleSelectContextType('base')}
            >
              <Text style={[styles.chipText, selectedContextType === 'base' && styles.chipTextActive]}>Any (Base)</Text>
            </Pressable>
            {activeConfig.duration && (
              <Pressable
                style={[styles.chip, selectedContextType === 'duration' && styles.chipActive]}
                onPress={() => handleSelectContextType('duration')}
              >
                <Text style={[styles.chipText, selectedContextType === 'duration' && styles.chipTextActive]}>Duration</Text>
              </Pressable>
            )}
            {activeConfig.severity && (
              <Pressable
                style={[styles.chip, selectedContextType === 'severity' && styles.chipActive]}
                onPress={() => handleSelectContextType('severity')}
              >
                <Text style={[styles.chipText, selectedContextType === 'severity' && styles.chipTextActive]}>Severity</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* 3. Select Value (if Context selected) */}
      {selectedSymptom && selectedContextType !== 'base' && (
        <View style={styles.selectionBlock}>
          <Text style={styles.stepTitle}>3. Context Value</Text>
          <View style={styles.chipContainer}>
            {(selectedContextType === 'duration' ? DURATION_OPTIONS : SEVERITY_OPTIONS).map(opt => {
              const expectedFactKey = getContextFactKey(selectedSymptom, selectedContextType, opt.value);
              const isSelected = value === expectedFactKey;
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => handleSelectValue(opt.value)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{opt.shortLabel || opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Output Display */}
      <View style={styles.outputBox}>
        <Text style={styles.outputLabel}>Resulting Internal Observation Key:</Text>
        <Text style={styles.outputValue}>{value || '(None Selected)'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgSurface2,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
  },
  toggleText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.brandBlue,
    fontWeight: TYPOGRAPHY.weight.bold,
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
  selectionBlock: {
    marginBottom: SPACING.md,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.brandNavy,
    fontWeight: TYPOGRAPHY.weight.bold,
    marginBottom: SPACING.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipActive: {
    backgroundColor: COLORS.brandNavy,
    borderColor: COLORS.brandNavy,
  },
  chipText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  chipTextActive: {
    color: COLORS.bgSurface,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  outputBox: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outputLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
  },
  outputValue: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.brandGreenDark,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    fontWeight: TYPOGRAPHY.weight.bold,
  }
});
