import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import {
  deleteCustomRule,
  getAllRulesAdmin,
  setCustomRuleEnabled,
  setSystemRuleActive,
} from '../database/DatabaseService';
import { Rule } from '../engine/types';
import { RuleStorageService } from '../services/RuleStorageService';

import RuleBuilder from '../components/RuleBuilder';
import TestBench from '../components/TestBench';
import BottomNav from '../components/BottomNav';
import Accordion from '../components/ui/Accordion';
import AdminSettings from '../components/AdminSettings';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AdminTab = 'LIST' | 'BUILDER' | 'TEST_BENCH' | 'SETTINGS';

interface RuleRecord {
  rule: Rule;
  isEnabled: boolean;
  isSystem: boolean;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface AdminScreenProps {
  onSwitchToWelcome: () => void;
}

export default function AdminScreen({ onSwitchToWelcome }: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('LIST');
  const [allRules, setAllRules] = useState<RuleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const rules = await getAllRulesAdmin();
      setAllRules(rules);
    } catch (error) {
      console.error('Failed to load rules:', error);
      Alert.alert('Error', 'Failed to load rules.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleToggleRule = async (id: string, currentlyEnabled: boolean, isSystem: boolean) => {
    try {
      // Optimistic UI update
      setAllRules(prev =>
        prev.map(r => (r.rule.id === id ? { ...r, isEnabled: !currentlyEnabled } : r))
      );
      if (isSystem) {
        await setSystemRuleActive(id, !currentlyEnabled);
      } else {
        await setCustomRuleEnabled(id, !currentlyEnabled);
      }
    } catch (err) {
      // Revert on failure
      fetchRules();
      Alert.alert('Error', 'Failed to toggle rule state.');
    }
  };

  const handleDeleteRule = (id: string, isSystem: boolean) => {
    if (isSystem) {
      Alert.alert('Restricted', 'System rules cannot be deleted for clinical safety reasons. You may disable them instead.');
      return;
    }

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
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    if (allRules.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No rules defined yet.</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.listContent}>
        <View style={styles.listHeaderRow}>
          <View>
            <Text style={styles.pageTitle}>Clinical Rules</Text>
            <Text style={styles.pageSubtitle}>Manage and review the active logic.</Text>
          </View>
          <View style={styles.listActionGroup}>
            <Pressable style={styles.listActionBtn} onPress={handleImport}>
              <Text style={styles.listActionText}>↓ Import</Text>
            </Pressable>
            <Pressable style={styles.listActionBtn} onPress={handleExport}>
              <Text style={styles.listActionText}>↑ Export</Text>
            </Pressable>
          </View>
        </View>
        
        {allRules.map(({ rule, isEnabled, isSystem }) => (
          <Accordion key={rule.id} title={isSystem ? `🔒 ${rule.id}` : rule.id} icon="shield">
            <View style={styles.ruleDetails}>
              <View style={styles.ruleSection}>
                <Text style={styles.ruleSectionTitle}>IF (Conditions)</Text>
                {rule.antecedents.map((ant, idx) => (
                  <Text key={idx} style={styles.ruleCode}>
                    • {ant.fact} {ant.operator} {String(ant.value)}
                  </Text>
                ))}
              </View>

              <View style={styles.ruleSection}>
                <Text style={styles.ruleSectionTitle}>THEN (Result)</Text>
                <Text style={styles.ruleCode}>
                  → {rule.consequent.fact} = {String(rule.consequent.value)}
                </Text>
              </View>

              <View style={styles.ruleSection}>
                <Text style={styles.ruleSectionTitle}>Metadata</Text>
                <Text style={styles.ruleCode}>Risk: {rule.metadata.riskCategory}</Text>
                <Text style={styles.ruleCode}>Priority: {rule.metadata.priority}</Text>
                <Text style={styles.ruleCode}>Advice: {rule.metadata.triageAdvice}</Text>
              </View>

              <View style={styles.ruleActions}>
                <Switch
                  value={isEnabled}
                  onValueChange={() => handleToggleRule(rule.id, isEnabled, isSystem)}
                  trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
                />
                {!isSystem ? (
                  <Pressable onPress={() => handleDeleteRule(rule.id, isSystem)} style={styles.deleteBtn}>
                    <Text style={styles.deleteText}>Delete Rule</Text>
                  </Pressable>
                ) : (
                  <Text style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic' }}>System Rule (Read-Only)</Text>
                )}
              </View>
            </View>
          </Accordion>
        ))}
      </ScrollView>
    );
  };


  return (
    <SafeAreaView style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>ArayKo!</Text>
            <Text style={styles.headerSubtitle}>Clinical Admin</Text>
          </View>
          <Pressable 
            style={(state: any) => [
              styles.homeBtn,
              state.hovered && styles.homeBtnHovered,
              state.pressed && styles.homeBtnPressed
            ]} 
            onPress={onSwitchToWelcome}
          >
            <Feather name="home" size={22} color="#059669" />
          </Pressable>
        </View>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {activeTab === 'LIST' && renderListTab()}
        {activeTab === 'BUILDER' && <RuleBuilder onRuleSaved={fetchRules} />}
        {activeTab === 'TEST_BENCH' && <TestBench />}
        {activeTab === 'SETTINGS' && <AdminSettings />}
      </View>

      {/* ── Bottom Nav ── */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { id: 'LIST', label: 'Rules', icon: 'list' },
          { id: 'BUILDER', label: 'Builder', icon: 'tool' },
          { id: 'TEST_BENCH', label: 'Test', icon: 'cpu' },
          { id: 'SETTINGS', label: 'Security', icon: 'shield' }
        ]}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#F0FDF4',
  card: '#FFFFFF',
  border: '#D1FAE5',
  primary: '#10B981', // Emerald
  text: '#064E3B',
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
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#064E3B',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
  },
  homeBtn: {
    position: 'absolute',
    right: 20,
    padding: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtnHovered: {
    backgroundColor: '#D1FAE5',
  },
  homeBtnPressed: {
    backgroundColor: '#A7F3D0',
    transform: [{ scale: 0.94 }],
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

  // ── Tab Bar (No longer used, using BottomNav) ──
  tabBar: {},
  tab: {},
  tabActive: {},
  tabText: {},
  tabTextActive: {},

  // ── Content ──
  content: {
    flex: 1,
  },
  listContent: {
    padding: 24,
    gap: 12,
  },
  listHeaderRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 16,
  },
  listActionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  listActionBtn: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  emptyText: {
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#064E3B',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  ruleDetails: {
    marginTop: 8,
  },
  ruleSection: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ruleSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  ruleCode: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#0F172A',
    marginBottom: 4,
  },
  ruleActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});

