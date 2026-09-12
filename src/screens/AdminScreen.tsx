import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import {
  deleteCustomRule,
  getCustomRulesAdmin,
  setCustomRuleEnabled,
} from '../database/DatabaseService';
import { Rule } from '../engine/types';
import { RuleStorageService } from '../services/RuleStorageService';

import RuleBuilder from '../components/RuleBuilder';
import TestBench from '../components/TestBench';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AdminTab = 'LIST' | 'BUILDER' | 'TEST_BENCH';

interface CustomRuleRecord {
  rule: Rule;
  isEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface AdminScreenProps {
  onSwitchToUser?: () => void;
}

export default function AdminScreen({ onSwitchToUser }: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('LIST');
  const [customRules, setCustomRules] = useState<CustomRuleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const rules = await getCustomRulesAdmin();
      setCustomRules(rules);
    } catch (error) {
      console.error('Failed to load custom rules:', error);
      Alert.alert('Error', 'Failed to load rules.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleToggleRule = async (id: string, currentlyEnabled: boolean) => {
    try {
      // Optimistic UI update
      setCustomRules(prev =>
        prev.map(r => (r.rule.id === id ? { ...r, isEnabled: !currentlyEnabled } : r))
      );
      await setCustomRuleEnabled(id, !currentlyEnabled);
    } catch (err) {
      // Revert on failure
      fetchRules();
      Alert.alert('Error', 'Failed to toggle rule state.');
    }
  };

  const handleDeleteRule = (id: string) => {
    Alert.alert('Delete Rule', `Are you sure you want to delete ${id}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCustomRule(id);
            fetchRules();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete rule.');
          }
        },
      },
    ]);
  };

  const handleExport = async () => {
    try {
      await RuleStorageService.exportRules();
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export rules to filesystem.');
    }
  };

  const handleImport = async () => {
    try {
      const summary = await RuleStorageService.importRules();
      if (!summary) return; // User cancelled

      let msg = `Successfully imported ${summary.successCount} rules.`;
      if (summary.failedRules.length > 0) {
        msg += `\n\nFailed to import ${summary.failedRules.length} rules due to validation errors.`;
        // Optionally, log or display the specific errors.
        console.warn('Import failures:', summary.failedRules);
      }

      Alert.alert('Import Complete', msg);
      fetchRules(); // Refresh list to show new rules
    } catch (error) {
      Alert.alert('Import Failed', 'Unable to import rules from the selected file.');
    }
  };

  // ── Render Helpers ────────────────────────────────────────────────────────

  const renderListTab = () => {
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      );
    }

    if (customRules.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No custom rules defined yet.</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.listContent}>
        {customRules.map(({ rule, isEnabled }) => (
          <View key={rule.id} style={styles.ruleCard}>
            <View style={styles.ruleCardHeader}>
              <View>
                <Text style={styles.ruleId}>{rule.id}</Text>
                <Text style={styles.ruleRisk}>
                  {rule.metadata.riskCategory} • Priority {rule.metadata.priority}
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={() => handleToggleRule(rule.id, isEnabled)}
                trackColor={{ false: '#D1D5DB', true: '#6366F1' }}
              />
            </View>
            <View style={styles.ruleCardFooter}>
              <Text style={styles.ruleDesc} numberOfLines={2}>
                {rule.metadata.description || 'No description provided.'}
              </Text>
              <Pressable onPress={() => handleDeleteRule(rule.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleGroup}>
            <Pressable style={styles.closeBtn} onPress={onSwitchToUser}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Admin</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={handleImport}>
              <Text style={styles.iconBtnText}>↓ Import</Text>
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={handleExport}>
              <Text style={styles.iconBtnText}>↑ Export</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Tab Bar ── */}
        <View style={styles.tabBar}>
          {(['LIST', 'BUILDER', 'TEST_BENCH'] as AdminTab[]).map(tab => {
            const isActive = activeTab === tab;
            const labels: Record<AdminTab, string> = {
              LIST: 'Rules',
              BUILDER: 'Builder',
              TEST_BENCH: 'Test Bench',
            };
            return (
              <Pressable
                key={tab}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {labels[tab]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {activeTab === 'LIST' && renderListTab()}
        {activeTab === 'BUILDER' && <RuleBuilder onRuleSaved={fetchRules} />}
        {activeTab === 'TEST_BENCH' && <TestBench />}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  primary: '#10B981', // Clean green for primary admin actions
  text: '#0F172A',
  muted: '#64748B',
  danger: '#EF4444',
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeBtn: {
    backgroundColor: '#F3F4F6',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.muted,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  iconBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },

  // ── Tab Bar ──
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: -1, // Overlap border
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
  },
  tabTextActive: {
    color: COLORS.primary,
  },

  // ── Content ──
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyText: {
    color: COLORS.muted,
    fontStyle: 'italic',
  },

  // ── Rule Card ──
  ruleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  ruleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleId: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  ruleRisk: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  ruleCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  ruleDesc: {
    flex: 1,
    fontSize: 13,
    color: COLORS.muted,
    marginRight: 12,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.danger,
  },
});

