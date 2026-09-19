import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { WorkingMemory } from '../engine/types';

interface SeverityGaugeProps {
  memory: WorkingMemory;
}

export default function SeverityGauge({ memory }: SeverityGaugeProps) {
  const [fillAnim] = useState(new Animated.Value(0));

  // Calculate current score
  let score = 0;
  for (const key in memory) {
    if (memory[key].value) {
      score += memory[key].weight || 0;
    }
  }

  // Cap at 1.0 for the bar visually
  const visualScore = Math.min(score, 1.0);

  // Determine color based on threshold
  let color = '#10B981'; // Green
  let label = 'Low Severity';
  
  if (score >= 1.0) {
    color = '#EF4444'; // Red
    label = 'Critical Severity';
  } else if (score >= 0.5) {
    color = '#F59E0B'; // Amber
    label = 'Moderate Severity';
  }

  useEffect(() => {
    Animated.spring(fillAnim, {
      toValue: visualScore,
      useNativeDriver: false, // width/color animations don't support native driver well
    }).start();
  }, [visualScore]);

  const widthInterpolation = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Severity Meter</Text>
        <Text style={[styles.score, { color }]}>{Math.min(score * 100, 100).toFixed(0)}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View 
          style={[
            styles.fill, 
            { width: widthInterpolation, backgroundColor: color }
          ]} 
        />
        {/* Threshold Markers */}
        <View style={[styles.marker, { left: '50%' }]} />
        <View style={[styles.marker, { left: '100%' }]} />
      </View>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginHorizontal: 20,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#064E3B',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    letterSpacing: -0.5,
  },
  score: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  track: {
    height: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
  marker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFFFFF',
    opacity: 0.5,
  },
  statusLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});

