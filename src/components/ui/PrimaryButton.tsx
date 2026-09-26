import React, { useRef, useEffect } from 'react';
import { Pressable, Text, StyleSheet, View, Animated, ViewStyle, TextStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../../theme/tokens';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  iconName?: keyof typeof Feather.glyphMap;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  buttonStyle?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export default function PrimaryButton({ label, onPress, iconName, disabled = false, style, buttonStyle, textStyle }: PrimaryButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          buttonStyle,
          disabled && styles.buttonDisabled,
        ]}
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        <View style={styles.contentWrapper}>
          {iconName && (
            <Feather name={iconName} size={18} color="#ffffff" style={styles.icon} />
          )}
          <Text style={[styles.label, disabled && styles.labelDisabled, textStyle]}>{label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1b2438',
    borderRadius: RADIUS.pill,
    paddingVertical: 8,
    paddingHorizontal: SPACING.xl,
    minHeight: 60,
    ...SHADOW.md,
    shadowColor: '#1b2438',
    shadowOpacity: 0.3,
  },
  buttonDisabled: {
    backgroundColor: COLORS.borderLight,
    shadowOpacity: 0,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#ffffff',
    fontFamily: TYPOGRAPHY.fontFamily.primary,
  },
  labelDisabled: {
    color: COLORS.textMuted,
  }
});
