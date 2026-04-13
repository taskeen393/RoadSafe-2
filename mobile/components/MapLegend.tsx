import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/**
 * Reusable Map Legend to explain markers and colors
 */
export default function MapLegend({ style }: { style?: any }) {
  const { colors: G } = useTheme();
  
  return (
    <View style={[styles.container, { 
      backgroundColor: G.card, 
      borderColor: G.divider,
      borderWidth: 1 
    }, style]}>
      <Text style={[styles.title, { color: G.text }]}>Legend / علامات</Text>
      
      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
        <Text style={[styles.label, { color: G.sub }]}>High Disaster Alert</Text>
      </View>
      
      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: '#fbbf24' }]} />
        <Text style={[styles.label, { color: G.sub }]}>Medium Risk Alert</Text>
      </View>
      
      <View style={styles.item}>
        <View style={styles.heatWrap}>
          <View style={[styles.heatDot, { backgroundColor: '#ef4444' }]} />
        </View>
        <Text style={[styles.label, { color: G.sub }]}>Landslide Hotspot</Text>
      </View>
      
      <View style={styles.item}>
        <MaterialCommunityIcons name="slope-downhill" size={14} color="#ef4444" />
        <Text style={[styles.label, { color: G.sub }]}>Past Landslide</Text>
      </View>

      <View style={styles.divider} />
      
      <View style={styles.item}>
        <MaterialCommunityIcons name="bus-clock" size={14} color={G.midGreen} />
        <Text style={[styles.label, { color: G.sub }]}>Live Traffic (Red/Yellow)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', 
    top: 20, 
    right: 12, 
    padding: 10, 
    borderRadius: 16,
    minWidth: 160,
    zIndex: 1000,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 6 }
    })
  },
  title: { fontSize: 11, fontWeight: '800', marginBottom: 10, letterSpacing: 0.5 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  heatWrap: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(239, 68, 68, 0.2)', justifyContent: 'center', alignItems: 'center' },
  heatDot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 10, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 6 }
});
