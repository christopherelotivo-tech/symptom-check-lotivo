import React, { useState, useRef } from 'react';
import { View, StyleSheet, StatusBar, Animated } from 'react-native';
import UserAssessmentScreen from './src/screens/UserAssessmentScreen';
import AdminScreen from './src/screens/AdminScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';

type AppMode = 'WELCOME' | 'USER' | 'ADMIN';

export default function App() {
  const [displayedMode, setDisplayedMode] = useState<AppMode>('WELCOME');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleModeChange = (newMode: AppMode) => {
    if (newMode === displayedMode) return;
    
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Swap screen while invisible
      setDisplayedMode(newMode);
      
      // Fade back in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />
      <Animated.View style={[styles.screenWrapper, { opacity: fadeAnim }]}>
        {displayedMode === 'WELCOME' && (
          <WelcomeScreen onSelectMode={handleModeChange} />
        )}
        {displayedMode === 'USER' && (
          <UserAssessmentScreen onSwitchToWelcome={() => handleModeChange('WELCOME')} />
        )}
        {displayedMode === 'ADMIN' && (
          <AdminScreen onSwitchToWelcome={() => handleModeChange('WELCOME')} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4', // Soft mint green to prevent harsh flash
  },
  screenWrapper: {
    flex: 1,
  }
});
