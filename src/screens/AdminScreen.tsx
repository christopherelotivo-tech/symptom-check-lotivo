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
import PrimaryButton from '../components/ui/PrimaryButton';
import AdminSettings from '../components/AdminSettings';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme/tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AdminTab = 'PATHWAYS' | 'SIMULATOR' | 'SYNC' | 'SETTINGS';

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
  const [activeTab, setActiveTab] = useState<AdminTab>('PATHWAYS');
  const [isBuilding, setIsBuilding] = useState(false);
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

  // ── Actions (DO NOT TOUCH) ────────────────────────────────────────────────
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
        console.warn('Import failures:', summary.failedRules);
      }

      Alert.alert('Import Complete', msg);
      fetchRules(); // Refresh list
    } catch (error) {
      Alert.alert('Import Failed', 'Unable to import rules from the selected file.');
    }
  };

  const renderSyncTab = () => (
    <ScrollView contentContainerStyle={[styles.listContent, {padding: SPACING.xl}]}>
      <View style={{marginBottom: SPACING.xxl}}>
        <Text style={styles.pageTitle}>Knowledge Sync</Text>
        <Text style={styles.pageSubtitle}>Backup and restore clinical pathways.</Text>
      </View>

      <View style={[styles.ruleCard, {padding: SPACING.xl, marginBottom: SPACING.xl}]}>
        <Feather name="download" size={32} color={COLORS.brandNavy} style={{marginBottom: SPACING.md}} />
        <Text style={{fontSize: 18, fontWeight: 'bold', color: COLORS.brandNavy, marginBottom: SPACING.sm}}>Export Knowledge Base</Text>
        <Text style={{color: COLORS.textMuted, marginBottom: SPACING.lg, lineHeight: 20}}>
          Save all active rules and clinical pathways to a secure file on your device for backup or transfer.
        </Text>
        <PrimaryButton label="Export to File" onPress={handleExport} />
      </View>

      <View style={[styles.ruleCard, {padding: SPACING.xl}]}>
        <Feather name="upload" size={32} color={COLORS.brandNavy} style={{marginBottom: SPACING.md}} />
        <Text style={{fontSize: 18, fontWeight: 'bold', color: COLORS.brandNavy, marginBottom: SPACING.sm}}>Import Knowledge Base</Text>
        <Text style={{color: COLORS.textMuted, marginBottom: SPACING.lg, lineHeight: 20}}>
          Load new clinical pathways from a verified JSON file. This will add new rules and update existing ones.
        </Text>
        <PrimaryButton label="Import from File" onPress={handleImport} />
      </View>
    </ScrollView>
  );

  // ── Render Helpers ────────────────────────────────────────────────────────
  const renderListTab = () => {
    if (isBuilding) {
      return (
        <View style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, paddingBottom: 0}}>
            <Pressable onPress={() => setIsBuilding(false)} style={{flexDirection: 'row', alignItems: 'center'}}>
               <Feather name="arrow-left" size={24} color={COLORS.brandNavy} />
               <Text style={{marginLeft: SPACING.sm, fontSize: 16, fontWeight: '600', color: COLORS.brandNavy}}>Back to Pathways</Text>
            </Pressable>
          </View>
          <RuleBuilder onRuleSaved={() => {
            fetchRules();
            setIsBuilding(false);
          }} />
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.brandNavy} />
        </View>
      );
    }

    if (allRules.length === 0) {
      return (
        <View style={[styles.center, { padding: SPACING.xxxl, alignItems: 'center' }]}>
          <Feather name="clipboard" size={48} color={COLORS.borderLight} style={{ marginBottom: SPACING.md }} />
          <Text style={[styles.emptyText, { fontSize: TYPOGRAPHY.size.md, color: COLORS.textMuted }]}>
            No guidelines defined yet.
          </Text>
          <Pressable style={[styles.listActionBtn, {marginTop: SPACING.lg, backgroundColor: COLORS.brandGreen}]} onPress={() => setIsBuilding(true)}>
             <Text style={[styles.listActionText, {color: COLORS.textOnGreen}]}>Add New Pathway</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.listContent}>
        <View style={styles.listHeaderRow}>
          <View>
            <Text style={styles.pageTitle}>Clinical Pathways</Text>
            <Text style={styles.pageSubtitle}>Manage active triage protocols.</Text>
          </View>
          <View style={styles.listActionGroup}>
            <Pressable style={styles.listActionBtn} onPress={() => setIsBuilding(true)}>
              <Feather name="plus" size={16} color={COLORS.brandNavy} />
              <Text style={styles.listActionText}> Add</Text>
            </Pressable>
          </View>
        </View>
        
        {allRules.map(({ rule, isEnabled, isSystem }) => {
          // Compute Risk Colors
          const riskColor = rule.metadata.riskCategory === 'Red' 
            ? COLORS.triageRedIcon 
            : rule.metadata.riskCategory === 'Amber' 
              ? COLORS.triageAmberIcon 
              : COLORS.triageGreenIcon;
              
          const riskBg = rule.metadata.riskCategory === 'Red' 
            ? COLORS.triageRedBg 
            : rule.metadata.riskCategory === 'Amber' 
              ? COLORS.triageAmberBg 
              : COLORS.triageGreenBg;

          return (
            <View key={rule.id} style={styles.guidelineCard}>
              <View style={styles.guidelineHeader}>
                <View style={styles.guidelineTitleRow}>
                  {isSystem && <Feather name="shield" size={16} color={COLORS.brandBlue} style={{ marginRight: SPACING.sm }} />}
                  <Text style={styles.guidelineTitle}>
                    {rule.metadata.description || 'Custom Clinical Guideline'}
                  </Text>
                </View>
                <View style={[styles.riskBadge, { backgroundColor: riskBg, borderColor: riskColor }]}>
                  <Text style={[styles.riskBadgeText, { color: riskColor }]}>
                    {rule.metadata.riskCategory.toUpperCase()} RISK
                  </Text>
                </View>
              </View>

              <View style={styles.guidelineClinicalBody}>
                <Text style={styles.clinicalLabel}>Triage Advice</Text>
                <Text style={styles.clinicalAdvice}>{rule.metadata.triageAdvice}</Text>
                
                <Text style={styles.clinicalLabel}>Required Symptoms</Text>
                <View style={styles.symptomPills}>
                  {rule.antecedents.filter(a => a.value === true).map((ant, idx) => (
                    <View key={idx} style={styles.symptomPill}>
                      <Text style={styles.symptomPillText}>{ant.fact.replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
                  {rule.antecedents.filter(a => a.value === false).map((ant, idx) => (
                    <View key={idx} style={[styles.symptomPill, styles.symptomPillNegative]}>
                      <Text style={[styles.symptomPillText, styles.symptomPillTextNegative]}>NO {ant.fact.replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <Accordion title="Show Technical Details" icon="code">
                <View style={styles.techDetailsBox}>
                  <Text style={styles.ruleSectionTitle}>SYSTEM IDENTIFIER</Text>
                  <Text style={styles.ruleCode}>{rule.id} (Priority: {rule.metadata.priority})</Text>
                  
                  <Text style={[styles.ruleSectionTitle, { marginTop: SPACING.md }]}>IF (CONDITIONS)</Text>
                  {rule.antecedents.map((ant, idx) => (
                    <Text key={idx} style={styles.ruleCode}>
                      • {ant.fact} {ant.operator} {String(ant.value)}
                    </Text>
                  ))}
                  
                  <Text style={[styles.ruleSectionTitle, { marginTop: SPACING.md }]}>THEN (RESULT)</Text>
                  <Text style={styles.ruleCode}>
                    → {rule.consequent.fact} = {String(rule.consequent.value)}
                  </Text>
                </View>
              </Accordion>

              <View style={styles.ruleActions}>
                <Switch
                  value={isEnabled}
                  onValueChange={() => handleToggleRule(rule.id, isEnabled, isSystem)}
                  trackColor={{ false: COLORS.borderLight, true: COLORS.brandBlue }}
                />
                {!isSystem ? (
                  <Pressable onPress={() => handleDeleteRule(rule.id, isSystem)} style={styles.deleteBtn}>
                    <Text style={styles.deleteText}>Delete Guideline</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.systemNote}>System Guideline (Read-Only)</Text>
                )}
              </View>
            </View>
          );
        })}
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
            <Feather name="home" size={22} color={COLORS.brandNavy} />
          </Pressable>
        </View>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {activeTab === 'PATHWAYS' && renderListTab()}
        {activeTab === 'SIMULATOR' && <TestBench />}
        {activeTab === 'SYNC' && renderSyncTab()}
        {activeTab === 'SETTINGS' && <AdminSettings />}
      </View>

      {/* ── Bottom Nav ── */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { id: 'PATHWAYS', label: 'Pathways', icon: 'git-branch' },
          { id: 'SIMULATOR', label: 'Simulator', icon: 'activity' },
          { id: 'SYNC', label: 'Sync', icon: 'database' },
          { id: 'SETTINGS', label: 'Settings', icon: 'settings' }
        ]}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.md,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    color: COLORS.brandNavy,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.weight.semibold,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  homeBtn: {
    position: 'absolute',
    right: SPACING.lg,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.pill,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
    shadowOpacity: 0.05,
  },
  homeBtnHovered: {
    backgroundColor: '#F8FAFC',
  },
  homeBtnPressed: {
    backgroundColor: '#F8FAFC',
    transform: [{ scale: 0.94 }],
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.xl,
    gap: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  listHeaderRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
    gap: SPACING.base,
  },
  listActionGroup: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  listActionBtn: {
    backgroundColor: COLORS.bgSurface,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
    shadowOpacity: 0.05,
  },
  listActionText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.brandBlue,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  pageTitle: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    color: COLORS.brandNavy,
    fontFamily: TYPOGRAPHY.fontFamily.primary,
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.brandBlue,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  ruleCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 108, 0.04)',
    ...SHADOW.md,
    shadowOpacity: 0.04,
  },
  guidelineCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 108, 0.04)',
    overflow: 'hidden',
    ...SHADOW.md,
    shadowOpacity: 0.04,
  },
  guidelineHeader: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  guidelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  guidelineTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.brandNavy,
    flex: 1,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  riskBadgeText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.extrabold,
    letterSpacing: 0.5,
  },
  guidelineClinicalBody: {
    padding: SPACING.lg,
  },
  clinicalLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  clinicalAdvice: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  symptomPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  symptomPill: {
    backgroundColor: COLORS.bgPrimary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderBrand,
  },
  symptomPillText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.brandBlue,
    fontWeight: TYPOGRAPHY.weight.semibold,
    textTransform: 'capitalize',
  },
  symptomPillNegative: {
    backgroundColor: COLORS.bgSurface2,
    borderColor: COLORS.borderLight,
  },
  symptomPillTextNegative: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  techDetailsBox: {
    paddingTop: SPACING.sm,
  },
  ruleSectionTitle: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  ruleCode: {
    fontSize: TYPOGRAPHY.size.sm,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  ruleActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.bgSurface2,
  },
  deleteBtn: {
    backgroundColor: COLORS.errorBg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  deleteText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.error,
  },
  systemNote: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.size.xs,
    fontStyle: 'italic',
  }
});


