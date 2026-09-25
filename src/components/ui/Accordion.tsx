import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../../theme/tokens';

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
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={title}
      >
        <View style={styles.titleGroup}>
          {icon && (
            <Feather name={icon} size={18} color={COLORS.brandBlue} style={styles.icon} />
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.textMuted}
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
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 108, 0.04)',
    overflow: 'hidden',
    ...SHADOW.md,
    shadowOpacity: 0.04,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.bgSurface,
    minHeight: 56,
  },
  headerPressed: {
    backgroundColor: '#F8FAFC',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 58, 108, 0.04)',
    backgroundColor: COLORS.bgSurface,
  },
});
