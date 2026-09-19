import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, TextInput, ActivityIndicator, Image, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PinService } from '../services/PinService';

interface WelcomeScreenProps {
  onSelectMode: (mode: 'USER' | 'ADMIN') => void;
}

export default function WelcomeScreen({ onSelectMode }: WelcomeScreenProps) {
  const [showPinAuth, setShowPinAuth] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [expectedPin, setExpectedPin] = useState('1234');
  const [isLoadingPin, setIsLoadingPin] = useState(false);

  const handleAdminPress = async () => {
    setIsLoadingPin(true);
    const savedPin = await PinService.getPin();
    setExpectedPin(savedPin);
    setIsLoadingPin(false);
    setShowPinAuth(true);
  };

  const handlePinChange = (text: string) => {
    setPin(text);
    setError(false);
    if (text.length === 4) {
      if (text === expectedPin) {
        onSelectMode('ADMIN');
      } else {
        setError(true);
        setPin('');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/icons/logo.jpg')} style={styles.logoImage} />
        <Text style={styles.title}>ArayKo!</Text>
        <Text style={styles.subtitle}>A Symptom Checker App</Text>
      </View>

      {!showPinAuth ? (
        <View style={styles.cardsContainer}>
          {/* Patient Card */}
          <Pressable 
            style={(state: any) => [
              styles.card, 
              styles.cardSpacing, 
              state.hovered && styles.cardHovered,
              state.pressed && styles.cardPressed
            ]}
            onPress={() => onSelectMode('USER')}
          >
            <View style={styles.cardIconContainer}>
              <Image source={require('../../assets/icons/patient_new.png')} style={styles.cardImage} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Start Assessment</Text>
              <Text style={styles.cardDescription}>Evaluate symptoms and receive triage advice.</Text>
            </View>
          </Pressable>

          {/* Doctor/Admin Card */}
          <Pressable 
            style={(state: any) => [
              styles.card, 
              state.hovered && styles.cardHovered,
              state.pressed && styles.cardPressed
            ]}
            onPress={handleAdminPress}
          >
            <View style={styles.cardIconContainerAdmin}>
              <Image source={require('../../assets/icons/doctor_new.jpg')} style={styles.cardImage} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Clinical Admin</Text>
              <Text style={styles.cardDescription}>Access rule builder and test bench.</Text>
            </View>
          </Pressable>
        </View>
      ) : (
        <View style={styles.pinContainer}>
          <Text style={styles.pinTitle}>Enter Clinical PIN</Text>
          <Text style={styles.pinSubtitle}>Enter your 4-digit security PIN</Text>
          
          <TextInput
            style={[styles.pinInput, error && styles.pinInputError]}
            value={pin}
            onChangeText={handlePinChange}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            autoFocus
          />
          
          {error && <Text style={styles.errorText}>Incorrect PIN</Text>}
          
          <Pressable style={styles.cancelButton} onPress={() => {
            setShowPinAuth(false);
            setPin('');
            setError(false);
          }}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.footerContainer}>
        <Text style={styles.footerAboutText}>
          An intelligent symptom checker designed to provide rapid clinical triage and reliable health insights securely on your device.
        </Text>
        <Text style={styles.footerCopyrightText}>All Rights Reserved 2026 by Group 4</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4', // Soft mint green background
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#064E3B',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardsContainer: {
    width: '100%',
    paddingHorizontal: 16, // Pulls the buttons inward to make the width noticeably smaller
    alignSelf: 'center',
    maxWidth: 400, // Prevents them from being too wide on tablets
  },
  cardSpacing: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  cardHovered: {
    backgroundColor: '#FAFAF9',
    borderColor: '#A7F3D0',
    shadowOpacity: 0.15,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#F8FAFC',
  },
  cardIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  cardIconContainerAdmin: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  cardImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#064E3B',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    letterSpacing: -0.5,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  pinContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  pinTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#064E3B',
    marginBottom: 8,
  },
  pinSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
  },
  pinInput: {
    width: 120,
    height: 60,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
    color: '#0F172A',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  pinInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  cancelButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  footerAboutText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  footerCopyrightText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  }
});

