import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { WorkingMemory } from '../engine/types';
import Checkbox from './ui/Checkbox';

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

interface SymptomItem {
  factKey: string;
  label: string;
  weight: number;
}

interface SymptomCategory {
  title: string;
  iconType: 'Feather' | 'MaterialCommunityIcons';
  iconName: any;
  symptoms: SymptomItem[];
}

const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    title: 'Respiratory',
    iconType: 'MaterialCommunityIcons',
    iconName: 'lungs',
    symptoms: [
      { factKey: 'shortness_of_breath', label: 'Shortness of Breath', weight: 0.8 },
      { factKey: 'cough',               label: 'Cough', weight: 0.2 },
      { factKey: 'wheezing',            label: 'Wheezing', weight: 0.4 },
      { factKey: 'chest_pain',          label: 'Chest Pain', weight: 0.9 },
    ],
  },
  {
    title: 'Systemic',
    iconType: 'Feather',
    iconName: 'activity',
    symptoms: [
      { factKey: 'fever',    label: 'Fever', weight: 0.3 },
      { factKey: 'fatigue',  label: 'Fatigue', weight: 0.1 },
      { factKey: 'nausea',   label: 'Nausea', weight: 0.2 },
      { factKey: 'vomiting', label: 'Vomiting', weight: 0.3 },
    ],
  },
  {
    title: 'Neurological',
    iconType: 'MaterialCommunityIcons',
    iconName: 'brain',
    symptoms: [
      { factKey: 'headache',   label: 'Headache', weight: 0.2 },
      { factKey: 'stiff_neck', label: 'Stiff Neck', weight: 0.6 },
      { factKey: 'dizziness',  label: 'Dizziness', weight: 0.3 },
      { factKey: 'confusion',  label: 'Confusion', weight: 0.8 },
    ],
  },
  {
    title: 'Dermatological',
    iconType: 'Feather',
    iconName: 'droplet',
    symptoms: [
      { factKey: 'rash',     label: 'Rash', weight: 0.1 },
      { factKey: 'swelling', label: 'Swelling', weight: 0.3 },
      { factKey: 'jaundice', label: 'Jaundice (Yellowing)', weight: 0.7 },
    ],
  },
];

interface SymptomFormProps {
  memory: WorkingMemory;
  onToggle: (fact: string, value: boolean, weight: number) => void;
}

export default function SymptomForm({ memory, onToggle }: SymptomFormProps) {
  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.formTitle}>How are you feeling today?</Text>
      <Text style={styles.formSubtitle}>
        Select any symptoms you are currently experiencing. We will evaluate them in real-time.
      </Text>

      {SYMPTOM_CATEGORIES.map((category) => (
        <View key={category.title} style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            {category.iconType === 'Feather' ? (
              <Feather name={category.iconName} size={24} color="#064E3B" style={styles.categoryIcon} />
            ) : (
              <MaterialCommunityIcons name={category.iconName} size={24} color="#064E3B" style={styles.categoryIcon} />
            )}
            <Text style={styles.categoryTitle}>{category.title}</Text>
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
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#064E3B',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 32,
    lineHeight: 24,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: 0.5,
  },
  categoryBody: {
    gap: 12,
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
