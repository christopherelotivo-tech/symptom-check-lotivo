import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import UserAssessmentScreen from './src/screens/UserAssessmentScreen';
import AdminScreen from './src/screens/AdminScreen';

export default function App() {
  const [currentMode, setCurrentMode] = useState<'USER' | 'ADMIN'>('USER');

  return (
    <>
      <StatusBar style="dark" />
      {currentMode === 'USER' ? (
        <UserAssessmentScreen onSwitchToAdmin={() => setCurrentMode('ADMIN')} />
      ) : (
        <AdminScreen onSwitchToUser={() => setCurrentMode('USER')} />
      )}
    </>
  );
}
