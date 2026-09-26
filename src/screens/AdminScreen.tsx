import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Image,
  LayoutAnimation,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

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
import { DURATION_OPTIONS, SEVERITY_OPTIONS } from '../utils/ContextConfig';

function formatFactName(fact: string): string {
  if (fact.includes('_duration_')) {
    const parts = fact.split('_duration_');
    const symptom = parts[0].replace(/_/g, ' ');
    const code = parts[1];
    const option = DURATION_OPTIONS.find(o => o.value === code);
    const durationLabel = option ? (option.shortLabel || option.label) : code.replace(/_/g, ' ');
    return `${symptom} (Duration: ${durationLabel})`;
  }
  if (fact.includes('_severity_')) {
    const parts = fact.split('_severity_');
    const symptom = parts[0].replace(/_/g, ' ');
    const code = parts[1];
    const option = SEVERITY_OPTIONS.find(o => o.value === code);
    const severityLabel = option ? (option.shortLabel || option.label) : code.replace(/_/g, ' ');
    return `${symptom} (Severity: ${severityLabel})`;
  }
  return fact.replace(/_/g, ' ');
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AdminTab = 'PROTOCOLS' | 'SIMULATOR' | 'SETTINGS';

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
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AdminTab>('PROTOCOLS');
  const [isBuilding, setIsBuilding] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [allRules, setAllRules] = useState<RuleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRiskTab, setActiveRiskTab] = useState<'All' | 'Red' | 'Amber' | 'Green'>('All');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleEditRule = (rule: Rule, isSystem: boolean) => {
    if (isSystem) {
      Alert.alert('Restricted', 'System rules cannot be edited for clinical safety reasons. You may disable them and create a custom replacement instead.');
      return;
    }
    setEditingRule(rule);
    setIsBuilding(true);
  };

  // ── Render Helpers ────────────────────────────────────────────────────────
  const renderListTab = () => {
    if (isBuilding) {
      return (
        <View style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.xs, paddingBottom: SPACING.sm}}>
            <Pressable onPress={() => { setIsBuilding(false); setEditingRule(null); }} style={{flexDirection: 'row', alignItems: 'center'}}>
               <Feather name="arrow-left" size={24} color={COLORS.brandNavy} />
               <Text style={{marginLeft: SPACING.sm, fontSize: 16, fontWeight: '600', color: COLORS.brandNavy}}>Back to Protocols</Text>
            </Pressable>
          </View>
          <RuleBuilder 
            initialRule={editingRule}
            onCancelEdit={() => { setIsBuilding(false); setEditingRule(null); }}
            onRuleSaved={() => {
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
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Health Protocols</Text>
            <Text style={styles.pageSubtitle}>Manage and monitor active health guidelines</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search protocols..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg }}>
          <Pressable style={styles.newProtocolBtn} onPress={() => setIsBuilding(true)}>
            <Feather name="plus" size={18} color="white" />
            <Text style={styles.newProtocolText}> New Protocol</Text>
          </Pressable>
        </View>

        {/* Risk Tabs */}
        <Text style={styles.tiersLabel}>ASSESSMENT URGENCY TIERS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.riskTabsContainer}>
          {(['All', 'Green', 'Amber', 'Red'] as const).map(category => {
            const count = category === 'All' 
              ? allRules.length 
              : allRules.filter(r => r.rule.metadata.riskCategory === category).length;
            const isActive = activeRiskTab === category;
            
            let color = COLORS.textSecondary;
            let bgColor = COLORS.bgSurface; // Inactive background
            let textColor = COLORS.textSecondary;
            let activeBgColor = 'white';

            if (category === 'Red') { color = COLORS.triageRedIcon; activeBgColor = '#EF4444'; }
            else if (category === 'Amber') { color = COLORS.triageAmberIcon; activeBgColor = '#F59E0B'; }
            else if (category === 'Green') { color = COLORS.triageGreenIcon; activeBgColor = '#10B981'; }
            else if (category === 'All') { color = COLORS.brandNavy; activeBgColor = '#0F766E'; }

            return (
              <Pressable 
                key={category} 
                style={[
                  styles.riskTabBtn,
                  { backgroundColor: bgColor, borderColor: 'transparent' },
                  isActive && { backgroundColor: activeBgColor }
                ]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setActiveRiskTab(category);
                }}
              >
                {category !== 'All' && !isActive && (
                  <View style={[styles.tierDot, { backgroundColor: color }]} />
                )}
                {category !== 'All' && isActive && (
                  <View style={[styles.tierDot, { backgroundColor: '#FFFFFF' }]} />
                )}
                <Text style={[
                  styles.riskTabText, 
                  { color: textColor },
                  isActive && { color: '#FFFFFF', fontWeight: '700' }
                ]}>
                  {category === 'Red' ? 'Emergency' : category === 'Amber' ? 'Doctor Consult' : category === 'Green' ? 'Low Concern' : 'All'}
                </Text>
                <View style={[
                  styles.countBadge, 
                  isActive ? { backgroundColor: 'rgba(255,255,255,0.2)' } : { backgroundColor: COLORS.bgPrimary }
                ]}>
                  <Text style={[
                    styles.countText, 
                    isActive ? { color: '#FFFFFF' } : { color: textColor }
                  ]}>{count}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Rules List for Active Risk */}
        {allRules
          .filter(r => (activeRiskTab === 'All' || r.rule.metadata.riskCategory === activeRiskTab))
          .filter(r => r.rule.metadata.description.toLowerCase().includes(searchQuery.toLowerCase()) || r.rule.id.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(({ rule, isEnabled, isSystem }) => (
          <View key={rule.id} style={styles.guidelineCard}>
            <View style={styles.guidelineHeader}>
              <View style={styles.tierPillRow}>
                <View style={[styles.tierPill, { 
                  backgroundColor: rule.metadata.riskCategory === 'Red' ? '#EF4444' : rule.metadata.riskCategory === 'Amber' ? '#F59E0B' : '#10B981',
                  borderColor: 'transparent'
                }]}>
                  <Text style={[styles.tierPillText, {
                    color: '#FFFFFF'
                  }]}>
                    {rule.metadata.riskCategory === 'Red' ? 'EMERGENCY TIER 3' : rule.metadata.riskCategory === 'Amber' ? 'CONSULT TIER 2' : 'LOW RISK TIER 1'}
                  </Text>
                </View>
              </View>

              <View style={styles.guidelineTitleRow}>
                <View style={styles.documentIconBox}>
                  <Feather name="file-text" size={20} color={COLORS.brandBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guidelineTitle}>
                    {rule.metadata.description || 'Custom Health Protocol'}
                  </Text>
                  <Text style={styles.guidelineSubtitle}>
                    {isSystem ? 'Primary health protocol • System rule' : 'Custom protocol • Local rule'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.guidelineClinicalBody}>
              <Accordion title="View Protocol Details & Conditions" icon="file-text">
                <Text style={styles.clinicalLabel}>ASSESSMENT ADVICE</Text>
                
                {rule.metadata.selfCareAdvice && (
                  <View style={styles.adviceRow}>
                    <View style={[styles.adviceBullet, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.adviceText}>
                      <Text style={{ fontWeight: 'bold', color: COLORS.brandNavy }}>Self-Care: </Text>
                      {rule.metadata.selfCareAdvice}
                    </Text>
                  </View>
                )}
                {rule.metadata.medicationAdvice && (
                  <View style={styles.adviceRow}>
                    <View style={[styles.adviceBullet, { backgroundColor: '#3B82F6' }]} />
                    <Text style={styles.adviceText}>
                      <Text style={{ fontWeight: 'bold', color: COLORS.brandNavy }}>Medication: </Text>
                      {rule.metadata.medicationAdvice}
                    </Text>
                  </View>
                )}
                {rule.metadata.escalationTrigger && (
                  <View style={styles.adviceRow}>
                    <View style={[styles.adviceBullet, { backgroundColor: '#F59E0B' }]} />
                    <Text style={styles.adviceText}>
                      <Text style={{ fontWeight: 'bold', color: COLORS.brandNavy }}>Escalate if: </Text>
                      {rule.metadata.escalationTrigger}
                    </Text>
                  </View>
                )}
                
                {/* Fallback if no categorized advice exists */}
                {!rule.metadata.selfCareAdvice && !rule.metadata.medicationAdvice && !rule.metadata.escalationTrigger && (
                  <Text style={styles.clinicalAdvice}>{rule.metadata.triageAdvice}</Text>
                )}

                <Text style={[styles.clinicalLabel, { marginTop: SPACING.lg }]}>REQUIRED SYMPTOM CONDITIONS</Text>
                <View style={styles.symptomPills}>
                  {rule.antecedents.filter(a => a.value === true).map((ant, idx) => {
                    const factName = formatFactName(ant.fact);
                        
                    return (
                      <View key={idx} style={[styles.symptomPill, { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' }]}>
                        <Feather name="check" size={12} color="#3B82F6" style={{ marginRight: 4 }} />
                        <Text style={[styles.symptomPillText, { color: '#3B82F6', textTransform: 'capitalize' }]}>{factName} (Present)</Text>
                      </View>
                    );
                  })}
                  {rule.antecedents.filter(a => a.value === false).map((ant, idx) => {
                    const factName = formatFactName(ant.fact);

                    return (
                      <View key={idx} style={[styles.symptomPill, { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' }]}>
                        <Feather name="x" size={12} color="#10B981" style={{ marginRight: 4 }} />
                        <Text style={[styles.symptomPillText, { color: '#10B981', textTransform: 'capitalize' }]}>{factName} (Absent)</Text>
                      </View>
                    );
                  })}
                </View>

                <View style={[styles.techDetailsBox, { marginTop: SPACING.xl }]}>
                  <Text style={styles.ruleSectionTitle}>SYSTEM IDENTIFIER</Text>
                  <Text style={styles.ruleCode}>{rule.id} (Priority: {rule.metadata.priority})</Text>
                  <Text style={[styles.ruleSectionTitle, { marginTop: SPACING.md }]}>IF (CONDITIONS)</Text>
                  {rule.antecedents.map((ant, idx) => (
                    <Text key={idx} style={styles.ruleCode}>
                      • {ant.fact} {ant.operator} {String(ant.value)}
                    </Text>
                  ))}
                  <Text style={[styles.ruleSectionTitle, { marginTop: SPACING.md }]}>THEN (RESULT)</Text>
                  <Text style={styles.ruleCode}>→ {rule.consequent.fact} = {String(rule.consequent.value)}</Text>
                </View>
              </Accordion>
            </View>

            <View style={styles.ruleActions}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Switch
                  value={isEnabled}
                  onValueChange={() => handleToggleRule(rule.id, isEnabled, isSystem)}
                  trackColor={{ false: COLORS.borderLight, true: '#10B981' }}
                />
                <Text style={{ marginLeft: SPACING.sm, color: isEnabled ? '#10B981' : COLORS.textSecondary, fontWeight: '600' }}>
                  {isEnabled ? 'Active' : 'Inactive'}
                </Text>
              </View>
              {!isSystem ? (
                <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                  <Pressable onPress={() => handleEditRule(rule, isSystem)} style={styles.editBtn}>
                    <Text style={styles.editText}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDeleteRule(rule.id, isSystem)} style={styles.deleteBtn}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.systemNote}>System Guideline (Read-Only)</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };


  return (
    <LinearGradient colors={['#D1FAE5', '#6EE7B7']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{ flex: 1 }}>
      <View style={[styles.root, { backgroundColor: 'transparent' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        {/* ── Header ── */}
        <View 
          style={{ backgroundColor: 'transparent', paddingHorizontal: SPACING.xl, paddingTop: insets.top + SPACING.sm, paddingBottom: SPACING.md, marginBottom: SPACING.sm }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BlurView intensity={60} tint="light" style={{ padding: 4, borderRadius: 20, marginRight: SPACING.md, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)' }}>
                <Image 
                  source={require('../../assets/icons/logo.jpg')}
                  style={{ width: 40, height: 40, borderRadius: 16 }}
                />
              </BlurView>
              <View style={{ alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.brandNavy, letterSpacing: -0.5 }}>
                  SymptaCare
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.brandBlue, fontWeight: '700' }}>
                  Clinical Admin
                </Text>
              </View>
            </View>

            <Pressable 
              style={(state: any) => [
                styles.homeBtn,
                state.hovered && styles.homeBtnHovered,
                state.pressed && styles.homeBtnPressed
              ]} 
              onPress={onSwitchToWelcome}
            >
              <Feather name="home" size={20} color={COLORS.brandNavy} />
            </Pressable>
          </View>
        </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {activeTab === 'PROTOCOLS' && renderListTab()}
        {activeTab === 'SIMULATOR' && <TestBench />}
        {activeTab === 'SETTINGS' && <AdminSettings onImportSuccess={fetchRules} />}
      </View>

      {/* ── Bottom Nav ── */}
      {(!isBuilding || activeTab !== 'PROTOCOLS') && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setActiveTab(tab as AdminTab);
          }}
          tabs={[
            { id: 'PROTOCOLS', label: 'Protocols', icon: 'clipboard' },
            { id: 'SIMULATOR', label: 'Simulator', icon: 'activity' },
            { id: 'SETTINGS', label: 'Settings', icon: 'settings' }
          ]}
        />
      )}
    </View>
    </LinearGradient>
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
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.pill,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 230, 230, 0.6)',
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
    paddingBottom: SPACING.xl,
  },
  listHeaderRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
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
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
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
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderBrand,
    flexDirection: 'row',
    alignItems: 'center',
  },
  symptomPillText: {
    fontSize: TYPOGRAPHY.size.base,
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
  editBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  editText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#3B82F6',
  },
  systemNote: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.size.xs,
    fontStyle: 'italic',
  },
  riskTabsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  riskTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: 'transparent',
    marginRight: SPACING.sm,
  },
  riskTabText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textPrimary,
  },
  newProtocolBtn: {
    flex: 1,
    backgroundColor: '#0F766E', // Teal
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  newProtocolText: {
    color: 'white',
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: '700',
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tiersLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: COLORS.bgSurface2,
  },
  countText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  tierPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  tierPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    marginRight: SPACING.md,
  },
  tierPillText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ruleIdText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  documentIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  guidelineSubtitle: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  adviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  adviceBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: SPACING.md,
  },
  adviceText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});



