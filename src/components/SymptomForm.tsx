import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Animated } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { WorkingMemory } from '../engine/types';
import Checkbox from './ui/Checkbox';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme/tokens';

export const SYMPTOM_CATEGORIES = [
  {
    title: 'respiratory',
    displayName: 'Respiratory',
    iconName: 'wind' as const,
    iconType: 'Feather',
    symptoms: [
      { factKey: 'cough', label: 'Cough', weight: 0.2 },
      { factKey: 'shortness_of_breath', label: 'Shortness of breath', weight: 0.5 },
      { factKey: 'sore_throat', label: 'Sore throat', weight: 0.1 },
      { factKey: 'runny_nose', label: 'Runny or stuffy nose', weight: 0.1 },
    ],
  },
  {
    title: 'systemic',
    displayName: 'Fever & Systemic',
    iconName: 'thermometer' as const,
    iconType: 'Feather',
    symptoms: [
      { factKey: 'fever', label: 'Fever', weight: 0.3 },
      { factKey: 'fatigue', label: 'Severe fatigue', weight: 0.2 },
      { factKey: 'chills', label: 'Chills or sweats', weight: 0.2 },
      { factKey: 'body_aches', label: 'Body or muscle aches', weight: 0.2 },
    ],
  },
  {
    title: 'neurological',
    displayName: 'Head & Neuro',
    iconName: 'brain' as const,
    iconType: 'MaterialCommunityIcons',
    symptoms: [
      { factKey: 'headache', label: 'Headache', weight: 0.2 },
      { factKey: 'dizziness', label: 'Dizziness or lightheadedness', weight: 0.3 },
      { factKey: 'confusion', label: 'Confusion or disorientation', weight: 0.8 },
      { factKey: 'stiff_neck', label: 'Stiff neck', weight: 0.6 },
    ],
  },
  {
    title: 'gastrointestinal',
    displayName: 'Digestive & Abdominal',
    iconName: 'stomach' as const,
    iconType: 'MaterialCommunityIcons',
    symptoms: [
      { factKey: 'nausea', label: 'Nausea or vomiting', weight: 0.2 },
      { factKey: 'abdominal_pain', label: 'Abdominal pain', weight: 0.4 },
      { factKey: 'diarrhea', label: 'Diarrhea', weight: 0.2 },
      { factKey: 'loss_of_appetite', label: 'Loss of appetite', weight: 0.1 },
    ],
  },
  {
    title: 'cardiovascular',
    displayName: 'Chest & Cardio',
    iconName: 'heart' as const,
    iconType: 'Feather',
    symptoms: [
      { factKey: 'chest_pain', label: 'Chest pain or pressure', weight: 0.8 },
      { factKey: 'palpitations', label: 'Rapid or irregular heartbeat', weight: 0.5 },
    ],
  },
  {
    title: 'dermatological',
    displayName: 'Skin & Visible Signs',
    iconName: 'hand' as const,
    iconType: 'MaterialCommunityIcons',
    symptoms: [
      { factKey: 'rash', label: 'Skin rash', weight: 0.2 },
      { factKey: 'swelling', label: 'Swelling (edema)', weight: 0.3 },
      { factKey: 'jaundice', label: 'Yellowing of skin/eyes (Jaundice)', weight: 0.6 },
    ],
  },
];

export const getSymptomLabel = (factKey: string) => {
  for (const cat of SYMPTOM_CATEGORIES) {
    const sym = cat.symptoms.find(s => s.factKey === factKey);
    if (sym) return sym.label;
  }
  return factKey;
};

interface SymptomFormProps {
  memory: WorkingMemory;
  onToggle: (fact: string, value: boolean, weight: number) => void;
}

export default function SymptomForm({ memory, onToggle }: SymptomFormProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const allSymptoms = useMemo(() => SYMPTOM_CATEGORIES.flatMap(cat => cat.symptoms), []);
  
  const filteredSymptoms = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowerQ = searchQuery.toLowerCase();
    return allSymptoms.filter(s => s.label.toLowerCase().includes(lowerQ));
  }, [searchQuery, allSymptoms]);

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.formTitle}>What symptom is bothering you most?</Text>
      <Text style={styles.formSubtitle}>
        For example, you can search 'fever' or 'headache'.
      </Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={COLORS.brandGreen} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a symptom"
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Feather name="x" size={16} color={COLORS.textMuted} />
          </Pressable>
        )}
      </View>

      {searchQuery.trim().length > 0 ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsHeader}>Symptoms found: {filteredSymptoms.length}</Text>
          {filteredSymptoms.map(symptom => {
            const isActive = memory[symptom.factKey]?.value === true;
            return (
              <Checkbox
                key={symptom.factKey}
                label={symptom.label}
                checked={isActive}
                onChange={(val) => onToggle(symptom.factKey, val, symptom.weight)}
              />
            );
          })}
        </View>
      ) : (
        <>
          <Text style={styles.popularHeader}>Browse Categories</Text>
          {SYMPTOM_CATEGORIES.map((category) => (
            <View key={category.title} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                {category.iconType === 'Feather' ? (
                  <Feather name={category.iconName as any} size={20} color={COLORS.brandGreen} style={styles.categoryIcon} />
                ) : (
                  <MaterialCommunityIcons name={category.iconName as any} size={20} color={COLORS.brandGreen} style={styles.categoryIcon} />
                )}
                <Text style={styles.categoryTitle}>{category.displayName}</Text>
              </View>

              <View style={styles.categoryBody}>
                {category.symptoms.map((symptom) => {
                  const isActive = memory[symptom.factKey]?.value === true;
                  return (
                    <Checkbox
                      key={symptom.factKey}
                      label={symptom.label}
                      checked={isActive}
                      onChange={(val) => onToggle(symptom.factKey, val, symptom.weight)}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  formTitle: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurface,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.2)', // Light brand green border
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.lg,
    height: 56,
    marginBottom: SPACING.xl,
    ...SHADOW.sm,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  clearBtn: {
    padding: SPACING.sm,
    backgroundColor: COLORS.bgSurface2,
    borderRadius: RADIUS.pill,
  },
  resultsContainer: {
    marginTop: SPACING.sm,
  },
  resultsHeader: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  popularHeader: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  categoryCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 108, 0.04)',
    ...SHADOW.md,
    shadowOpacity: 0.04,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: 'rgba(16, 185, 129, 0.05)', // extremely subtle green tint
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 58, 108, 0.05)',
  },
  categoryIcon: {
    marginRight: SPACING.sm,
  },
  categoryTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    color: COLORS.textPrimary,
  },
  categoryBody: {
    padding: SPACING.lg,
  },
});
