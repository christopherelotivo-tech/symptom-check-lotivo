import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, SafeAreaView, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface TabConfig<T extends string> {
  id: T;
  label: string;
  icon: any; // Feather icon name
}

interface BottomNavProps<T extends string> {
  tabs: TabConfig<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
}

// ---------------------------------------------------------------------------
// Animated Tab Item
// ---------------------------------------------------------------------------

function AnimatedTab({ tab, isActive, onPress }: { tab: TabConfig<any>; isActive: boolean; onPress: () => void }) {
  const anim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // Color interpolation requires JS driver
    }).start();
  }, [isActive]);

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 1)'] // Smooth transition to Emerald Green
  });

  const contentColor = isActive ? '#FFFFFF' : '#94A3B8';

  return (
    <Pressable
      style={(state: any) => [
        styles.tabWrapper,
        state.hovered && !isActive && styles.tabHovered,
        state.pressed && styles.tabPressed
      ]}
      onPress={onPress}
    >
      <Animated.View style={[styles.tabBackground, { backgroundColor }]}>
        <Feather 
          name={tab.icon} 
          size={20} 
          color={contentColor}
          style={styles.iconSpacing}
        />
        <Text style={[styles.label, { color: contentColor }]}>
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function BottomNav<T extends string>({ tabs, activeTab, onTabChange }: BottomNavProps<T>) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {tabs.map((tab) => (
          <AnimatedTab 
            key={tab.id} 
            tab={tab} 
            isActive={activeTab === tab.id} 
            onPress={() => onTabChange(tab.id)} 
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 56 : 64, // Base height before safe area
    backgroundColor: '#FFFFFF',
  },
  tabWrapper: {
    flex: 1,
    marginHorizontal: 8,
    marginVertical: 6,
    borderRadius: 14,
  },
  tabBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 4,
  },
  tabHovered: {
    backgroundColor: '#F8FAFC',
  },
  tabPressed: {
    transform: [{ scale: 0.94 }],
  },
  iconSpacing: {
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  }
});
