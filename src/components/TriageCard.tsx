import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TriageResult } from '../engine/types';

interface TriageCardProps {
  result: TriageResult | null;
}

export default function TriageCard({ result }: TriageCardProps) {
  if (!result) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <Feather name="shield" size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
        <Text style={styles.emptyTitle}>Awaiting Assessment</Text>
        <Text style={styles.emptySubtitle}>
          Select your symptoms to generate a clinical triage recommendation.
        </Text>
      </View>
    );
  }

  const { riskCategory, triageAdvice, description } = result;

  const bgStyles: Record<string, any> = {
    Red:   styles.bgRed,
    Amber: styles.bgAmber,
    Green: styles.bgGreen,
  };

  const textStyles: Record<string, any> = {
    Red:   styles.textRed,
    Amber: styles.textAmber,
    Green: styles.textGreen,
  };

  const icons: Record<string, keyof typeof Feather.glyphMap> = {
    Red: 'alert-triangle',
    Amber: 'alert-circle',
    Green: 'check-circle',
  };

  return (
    <View style={[styles.card, bgStyles[riskCategory] || styles.bgGreen]}>
      <View style={styles.header}>
        <Feather 
          name={icons[riskCategory] || 'info'} 
          size={32} 
          color={textStyles[riskCategory]?.color || '#000'} 
        />
        <Text style={[styles.riskBadge, textStyles[riskCategory]]}>
          {riskCategory.toUpperCase()} RISK
        </Text>
      </View>

      <Text style={[styles.advice, textStyles[riskCategory]]}>{triageAdvice}</Text>
      
      {description && (
        <View style={[styles.divider, { borderTopColor: textStyles[riskCategory]?.color }]}>
          <Text style={[styles.description, textStyles[riskCategory]]}>{description}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 32,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 48,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  riskBadge: {
    fontSize: 24,
    fontWeight: '900',
    marginLeft: 12,
    letterSpacing: -0.5,
  },
  advice: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 24,
  },
  divider: {
    borderTopWidth: 1,
    opacity: 0.5,
    paddingTop: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  
  // Dramatic Backgrounds
  bgRed:   { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 2 },
  bgAmber: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 2 },
  bgGreen: { backgroundColor: '#F0FDF4', borderColor: '#A7F3D0', borderWidth: 2 },
  
  // High contrast text
  textRed:   { color: '#991B1B' },
  textAmber: { color: '#92400E' },
  textGreen: { color: '#064E3B' },
});
