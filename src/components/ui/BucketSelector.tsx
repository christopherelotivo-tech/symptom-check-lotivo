import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme/tokens';
import { Feather } from '@expo/vector-icons';

export interface BucketOption {
  label: string;
  value: string;
}

interface BucketSelectorProps {
  label: string;
  options: BucketOption[];
  value?: string;
  onChange: (value: string) => void;
}

function AnimatedBucket({ opt, isSelected, onPress }: { opt: BucketOption; isSelected: boolean; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 0.98 : 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [isSelected, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={[styles.bucket, isSelected && styles.bucketSelected]}
        onPress={onPress}
      >
        <Text style={[styles.bucketText, isSelected && styles.bucketTextSelected]}>
          {opt.label}
        </Text>
        {isSelected && (
          <Feather name="check-circle" size={18} color="#FFFFFF" />
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function BucketSelector({ label, options, value, onChange }: BucketSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.questionLabel}>{label}</Text>
      <View style={styles.optionsContainer}>
        {options.map((opt) => (
          <AnimatedBucket
            key={opt.value}
            opt={opt}
            isSelected={value === opt.value}
            onPress={() => onChange(opt.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  questionLabel: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.brandNavy,
    marginBottom: SPACING.md,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
  },
  optionsContainer: {
    gap: SPACING.sm,
  },
  bucket: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#FFFFFF', // Pure white unselected
    borderWidth: 1.5,
    borderColor: 'rgba(26, 58, 108, 0.05)',
    borderRadius: RADIUS.pill,
    minHeight: 52, // Mobile touch target size
  },
  bucketSelected: {
    backgroundColor: '#059669', // Dark Emerald selected
    borderColor: 'transparent', 
  },
  bucketText: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.brandNavy,
    fontWeight: TYPOGRAPHY.weight.medium,
    flex: 1,
    paddingRight: SPACING.md,
  },
  bucketTextSelected: {
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.weight.bold,
  },
});
