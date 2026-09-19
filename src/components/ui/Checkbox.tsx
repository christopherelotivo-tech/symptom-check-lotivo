import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  iconName?: keyof typeof Feather.glyphMap;
}

export default function Checkbox({ label, checked, onChange, iconName }: CheckboxProps) {
  return (
    <Pressable
      style={[styles.container, checked && styles.containerChecked]}
      onPress={() => onChange(!checked)}
    >
      <View style={styles.leftContent}>
        {iconName && (
          <Feather 
            name={iconName} 
            size={20} 
            color={checked ? '#10B981' : '#64748B'} 
            style={styles.icon}
          />
        )}
        <Text style={[styles.label, checked && styles.labelChecked]}>
          {label}
        </Text>
      </View>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Feather name="check" size={16} color="#FFFFFF" />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  containerChecked: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
    shadowColor: '#10B981',
    shadowOpacity: 0.15,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  labelChecked: {
    color: '#064E3B',
    fontWeight: '700',
  },
  box: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  boxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
});

