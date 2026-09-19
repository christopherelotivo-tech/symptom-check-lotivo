import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuditTrailEntry } from '../engine/types';
import Accordion from './ui/Accordion';

interface AuditTrailViewProps {
  auditTrail: AuditTrailEntry[];
}

export default function AuditTrailView({ auditTrail }: AuditTrailViewProps) {
  if (auditTrail.length === 0) return null;

  const reportedSymptoms = auditTrail.filter(e => e.type === 'USER_INPUT');
  const activatedRules = auditTrail.filter(e => e.type === 'RULE_FIRED');
  const derivedFacts = auditTrail.filter(e => e.type === 'FACT_DERIVED');

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Clinical Execution Trace</Text>
      
      <Accordion title="Symptoms Reported" icon="user" defaultExpanded={true}>
        {reportedSymptoms.length === 0 ? (
          <Text style={styles.emptyText}>No symptoms reported.</Text>
        ) : (
          reportedSymptoms.map((entry, index) => (
            <View key={entry.id} style={styles.row}>
              <Feather name="check" size={16} color="#10B981" />
              <Text style={styles.rowText}>{(entry as any).fact}</Text>
            </View>
          ))
        )}
      </Accordion>

      <Accordion title="Rules Activated" icon="cpu">
        {activatedRules.length === 0 ? (
          <Text style={styles.emptyText}>No clinical rules triggered.</Text>
        ) : (
          activatedRules.map((entry, index) => (
            <View key={entry.id} style={styles.row}>
              <Feather name="zap" size={16} color="#F59E0B" />
              <Text style={styles.rowText}>Rule ID: {(entry as any).ruleId}</Text>
            </View>
          ))
        )}
      </Accordion>

      <Accordion title="Derived Medical Facts" icon="database">
        {derivedFacts.length === 0 ? (
          <Text style={styles.emptyText}>No new facts derived.</Text>
        ) : (
          derivedFacts.map((entry, index) => (
            <View key={entry.id} style={styles.row}>
              <Feather name="file-text" size={16} color="#3B82F6" />
              <Text style={styles.rowText}>{(entry as any).fact} = true</Text>
            </View>
          ))
        )}
      </Accordion>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  emptyText: {
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
  },
  rowText: {
    fontSize: 15,
    color: '#334155',
    marginLeft: 12,
    fontWeight: '500',
  }
});
