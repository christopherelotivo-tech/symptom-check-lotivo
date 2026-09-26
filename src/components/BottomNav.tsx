import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme/tokens';

export interface TabConfig<T extends string> {
  id: T;
  label: string;
  icon: any;
}

interface BottomNavProps<T extends string> {
  tabs: TabConfig<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
  badgeCounts?: Partial<Record<T, number>>;
}

function AnimatedTab({
  tab,
  isActive,
  onPress,
  badgeCount,
}: {
  tab: TabConfig<any>;
  isActive: boolean;
  onPress: () => void;
  badgeCount?: number;
}) {
  const contentColor = isActive ? COLORS.textOnGreen : COLORS.textMuted;

  return (
    <Pressable
      style={[
        styles.tabWrapper,
        isActive && styles.tabActive
      ]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
    >
      <View style={styles.iconWrapper}>
        <Feather name={tab.icon} size={20} color={contentColor} />
        {badgeCount !== undefined && badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, { color: contentColor }]}>
        {tab.label}
      </Text>
    </Pressable>
  );
}

export default function BottomNav<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  badgeCounts,
}: BottomNavProps<T>) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {tabs.map((tab) => (
          <AnimatedTab
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onPress={() => onTabChange(tab.id)}
            badgeCount={badgeCounts?.[tab.id]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  container: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOW.md,
    shadowOpacity: 0.1,
    minWidth: 280, // Enough space for tabs
  },
  tabWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    height: 52,
    borderRadius: RADIUS.pill,
  },
  tabActive: {
    backgroundColor: COLORS.brandGreen,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.pill,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textOnNavy,
  },
  label: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
    letterSpacing: 0.2,
  },
});
