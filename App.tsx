import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Text, SafeAreaView, FlatList } from 'react-native';
import UserAssessmentScreen from './src/screens/UserAssessmentScreen';
import AdminScreen from './src/screens/AdminScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import BottomNav, { TabConfig } from './src/components/BottomNav';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from './src/theme/tokens';
import { getAssessmentHistory, PatientAssessmentRecord } from './src/services/HistoryService';
import { Feather } from '@expo/vector-icons';
import PrimaryButton from './src/components/ui/PrimaryButton';
import { initDatabase } from './src/database/DatabaseService';

type AppZone = 'PATIENT' | 'ADMIN';
type PatientTab = 'HOME' | 'HISTORY' | 'SETTINGS';

const PATIENT_TABS: TabConfig<PatientTab>[] = [
  { id: 'HOME', label: 'Home', icon: 'home' },
  { id: 'HISTORY', label: 'History', icon: 'clock' },
  { id: 'SETTINGS', label: 'Settings', icon: 'settings' }
];

function PatientZone({ onSwitchToAdmin }: { onSwitchToAdmin: () => void }) {
  const [activeTab, setActiveTab] = useState<PatientTab>('HOME');
  const [isAssessing, setIsAssessing] = useState(false);
  
  const [history, setHistory] = useState<PatientAssessmentRecord[]>([]);

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    try {
      const records = await getAssessmentHistory();
      setHistory(records);
    } catch (err) {
      console.error(err);
    }
  };

  const renderHistoryTab = () => (
    <SafeAreaView style={{flex: 1, backgroundColor: COLORS.bgPrimary}}>
      <View style={{padding: SPACING.xl, paddingBottom: SPACING.md}}>
        <Text style={{fontSize: TYPOGRAPHY.size.xxl, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.brandNavy}}>Assessment History</Text>
        <Text style={{color: COLORS.textMuted, marginTop: SPACING.xs}}>Your past triage results.</Text>
      </View>
      <FlatList
        data={history}
        keyExtractor={item => item.id}
        contentContainerStyle={{padding: SPACING.xl, paddingBottom: 100}}
        ListEmptyComponent={
          <View style={{alignItems: 'center', marginTop: 40}}>
             <Feather name="clock" size={48} color={COLORS.borderLight} style={{marginBottom: SPACING.md}} />
             <Text style={{color: COLORS.textMuted}}>No past assessments found.</Text>
          </View>
        }
        renderItem={({item}) => {
          const riskColor = item.triage === 'Red' ? COLORS.triageRedIcon : item.triage === 'Amber' ? COLORS.triageAmberIcon : COLORS.triageGreenIcon;
          return (
            <View style={styles.historyCard}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm}}>
                <Text style={{fontWeight: 'bold', color: COLORS.brandNavy}}>
                  {new Date(item.date).toLocaleDateString()}
                </Text>
                <Text style={{fontWeight: 'bold', color: riskColor}}>
                  {item.triage} Risk
                </Text>
              </View>
              <Text style={{color: COLORS.textSecondary, marginBottom: SPACING.md}} numberOfLines={2}>
                {item.advice}
              </Text>
              <Text style={{fontSize: 12, color: COLORS.textMuted}}>
                Symptoms: {item.symptoms.join(', ')}
              </Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );

  const renderSettingsTab = () => (
    <SafeAreaView style={{flex: 1, backgroundColor: COLORS.bgPrimary}}>
      <View style={{padding: SPACING.xl}}>
        <Text style={{fontSize: TYPOGRAPHY.size.xxl, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS.brandNavy}}>Settings</Text>
      </View>
      
      <View style={{padding: SPACING.xl}}>
        <View style={styles.historyCard}>
           <Feather name="info" size={24} color={COLORS.brandNavy} style={{marginBottom: SPACING.sm}} />
           <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: SPACING.xs}}>About ArayKo!</Text>
           <Text style={{color: COLORS.textMuted, lineHeight: 20}}>
             ArayKo! is an offline clinical symptom triage engine. It does not provide medical diagnosis.
           </Text>
        </View>
        
        <Text 
          onPress={onSwitchToAdmin} 
          style={{marginTop: SPACING.xxxl, color: COLORS.textMuted, textAlign: 'center', padding: SPACING.xl}}
        >
          App Version 1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );

  return (
    <View style={styles.zoneContainer}>
      <View style={styles.content}>
        {activeTab === 'HOME' && (
          isAssessing ? (
            <UserAssessmentScreen onSwitchToWelcome={() => setIsAssessing(false)} />
          ) : (
            <WelcomeScreen onSelectMode={(mode) => {
              if (mode === 'USER') setIsAssessing(true);
              if (mode === 'ADMIN') onSwitchToAdmin(); // Fallback if they use the old PIN logic
            }} />
          )
        )}
        {activeTab === 'HISTORY' && renderHistoryTab()}
        {activeTab === 'SETTINGS' && renderSettingsTab()}
      </View>
      {!isAssessing && (
        <BottomNav tabs={PATIENT_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </View>
  );
}

export default function App() {
  const [zone, setZone] = useState<AppZone>('PATIENT');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setIsReady(true));
  }, []);

  if (!isReady) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgPrimary} />
      {zone === 'PATIENT' ? (
        <PatientZone onSwitchToAdmin={() => setZone('ADMIN')} />
      ) : (
        <AdminScreen onSwitchToWelcome={() => setZone('PATIENT')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  zoneContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  historyCard: {
    backgroundColor: COLORS.bgSurface,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 108, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  }
});
