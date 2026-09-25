import React, { useRef, useEffect } from 'react';
import { Pressable, Text, StyleSheet, View, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../../theme/tokens';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  iconName?: keyof typeof Feather.glyphMap;
}

export default function Checkbox({ label, checked, onChange, iconName }: CheckboxProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: checked ? 0.98 : 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [checked, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={[styles.container, checked && styles.containerChecked]}
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
      >
        <View style={styles.leftContent}>
          {iconName && (
            <Feather
              name={iconName}
              size={18}
              color={checked ? COLORS.brandGreen : COLORS.textMuted}
              style={styles.icon}
            />
          )}
          <Text style={[styles.label, checked && styles.labelChecked]}>{label}</Text>
        </View>
        <View style={[styles.iconBox, checked && styles.iconBoxChecked]}>
          <Feather 
            name={checked ? "check" : "help-circle"} 
            size={16} 
            color={checked ? COLORS.bgSurface : COLORS.textMuted} 
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: SPACING.base,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.pill,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 56,
    ...SHADOW.sm,
  },
  containerChecked: {
    borderColor: 'rgba(16, 185, 129, 0.4)', // Soft green outline
    backgroundColor: '#F0FDF4', // Very light mint background
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: SPACING.sm,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  labelChecked: {
    color: COLORS.brandNavy,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bgSurface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxChecked: {
    backgroundColor: COLORS.brandGreen,
  },
});
