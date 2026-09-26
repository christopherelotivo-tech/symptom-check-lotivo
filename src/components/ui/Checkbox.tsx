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
              color={checked ? '#FFFFFF' : COLORS.textMuted}
              style={styles.icon}
            />
          )}
          <Text style={[styles.label, checked && styles.labelChecked]}>{label}</Text>
        </View>
        <View style={[styles.iconBox, checked && styles.iconBoxChecked]}>
          <Feather 
            name={checked ? "check" : "help-circle"} 
            size={16} 
            color={checked ? '#FFFFFF' : COLORS.textMuted} 
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
    backgroundColor: '#FFFFFF', // Pure white so it doesn't camouflage against the mint card
    borderRadius: RADIUS.pill,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(26, 58, 108, 0.05)',
    minHeight: 56,
    ...SHADOW.sm,
  },
  containerChecked: {
    borderColor: 'transparent',
    backgroundColor: '#059669', // Dark Emerald when checked
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
    color: COLORS.brandNavy,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  labelChecked: {
    color: '#FFFFFF',
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxChecked: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  }
});
