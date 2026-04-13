import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Marker, Heatmap } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DisasterAlert, LandslideEvent } from '../services/types';

interface Props {
  disasters: DisasterAlert[];
  landslideHistory: LandslideEvent[];
  showLandslideHistory?: boolean;
}

/**
 * Shared map layers for disasters and landslide alerts
 */
export default function DisasterMapLayers({ disasters, landslideHistory, showLandslideHistory = true }: Props) {
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Red': return '#ef4444';
      case 'Orange': return '#f97316';
      case 'Yellow': return '#fbbf24';
      case 'Green': return '#22c55e';
      default: return '#94a3b8';
    }
  };

  return (
    <>
      {/* Landslide Heatmap Layer */}
      {showLandslideHistory && landslideHistory.length > 0 && (
        <Heatmap
          points={landslideHistory.map(l => ({ 
            latitude: l.lat, 
            longitude: l.lon, 
            weight: l.severity === 'High' ? 3 : l.severity === 'Medium' ? 2 : 1 
          }))}
          radius={Platform.OS === 'ios' ? 45 : 35}
          opacity={0.65}
          gradient={{
            colors: ["#79BC6A", "#BBC657", "#E5E500", "#E59400", "#ef4444"],
            startPoints: [0.01, 0.25, 0.5, 0.75, 1],
            colorMapSize: 256
          }}
        />
      )}

      {/* Historical Landslide Significant Markers */}
      {showLandslideHistory && landslideHistory.map((l) => (
        <Marker 
          key={`hist-${l.id}`}
          coordinate={{ latitude: l.lat, longitude: l.lon }}
          title={l.location}
          description={`${l.date}: ${l.cause}`}
        >
          <View style={[styles.histMarker, { backgroundColor: getSeverityColor(l.severity === 'High' ? 'Red' : l.severity === 'Medium' ? 'Orange' : 'Yellow') }]}>
            <MaterialCommunityIcons name="slope-downhill" size={13} color="#fff" />
          </View>
        </Marker>
      ))}

      {/* NDMA Disaster Markers */}
      {disasters.map((d) => (
        <Marker 
          key={`dm-${d.id}`} 
          coordinate={{ latitude: d.lat, longitude: d.lon }} 
          pinColor={getSeverityColor(d.severity)}
          title={d.title}
          description={d.description}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  histMarker: { 
    width: 24, height: 24, borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', 
    borderWidth: 2, borderColor: '#fff',
    elevation: 4, shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2 
  },
});
