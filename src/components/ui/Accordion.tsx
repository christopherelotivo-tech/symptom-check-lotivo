import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface AccordionProps {
  title: string;
  icon?: keyof typeof Feather.glyphMap;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export default function Accordion({ title, icon, children, defaultExpanded = false }: AccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.container}>
      <Pressable 
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]} 
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.titleGroup}>
          {icon && <Feather name={icon} size={20} color="#10B981" style={styles.icon} />}
          <Text style={styles.title}>{title}</Text>
        </View>
        <Feather 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={24} 
          color="#94A3B8" 
        />
      </Pressable>
      {expanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  headerPressed: {
    backgroundColor: '#F8FAFC',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAF9',
  }
});

