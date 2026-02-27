import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useToast } from '../../components/ToastContext';
import { useTheme } from '../context/ThemeContext';

// Import SOS service
import { sosService } from '../services';
import { Place } from '../services/types';

const TYPES = ['hospital', 'police', 'fire_station'];

export default function TrackScreen() {
  const { showToast } = useToast();
  const { colors: G, isDark } = useTheme();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeType, setActiveType] = useState('hospital');
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast({ type: 'warning', title: 'Permission Denied', message: 'Location access is required for SOS features' });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  useEffect(() => {
    if (location) fetchPlaces(activeType);
  }, [location, activeType]);

  const fetchPlaces = async (type: string) => {
    if (!location) return;
    setLoading(true);
    try {
      const results = await sosService.getNearbyPlaces(
        location.latitude,
        location.longitude,
        type
      );
      setPlaces(results);
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Failed to fetch nearby places' });
    } finally {
      setLoading(false);
    }
  };

  const openDirections = (lat: number, lon: number) => {
    const url = Platform.select({
      ios: `maps:0,0?saddr=My+Location&daddr=${lat},${lon}`,
      android: `google.navigation:q=${lat},${lon}`,
    });
    if (url) Linking.openURL(url);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hospital': return '🏥';
      case 'police': return '🚔';
      case 'fire_station': return '🚒';
      default: return '📍';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hospital': return '#EF4444';
      case 'police': return '#3B82F6';
      case 'fire_station': return '#F97316';
      default: return '#6B7280';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: G.bg }]}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location?.latitude || 24.8607,
          longitude: location?.longitude || 67.0011,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        region={location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : undefined}
      >
        {location && (
          <Marker coordinate={location} title="You are here" pinColor="#2D7A4D" />
        )}
        {places.map((place, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: place.lat, longitude: place.lon }}
            title={place.name}
            description={place.address}
            pinColor={getTypeColor(activeType)}
          />
        ))}
      </MapView>

      {/* Bottom Panel */}
      <View style={[styles.panel, { backgroundColor: G.card, borderColor: G.border }]}>
        {/* Type Tabs */}
        <View style={styles.tabs}>
          {TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.tab, { backgroundColor: activeType === type ? getTypeColor(type) : G.chipBg }]}
              onPress={() => setActiveType(type)}
            >
              <Text style={styles.tabEmoji}>{getTypeIcon(type)}</Text>
              <Text style={[styles.tabText, { color: activeType === type ? '#fff' : G.text }]}>
                {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Places List */}
        <FlatList
          data={places}
          keyExtractor={(_, i) => i.toString()}
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 200 }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: G.sub }]}>
              {loading ? 'Searching nearby...' : 'No places found nearby'}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.placeCard, { backgroundColor: G.inputBg, borderColor: G.border }]}
              onPress={() => openDirections(item.lat, item.lon)}
              activeOpacity={0.7}
            >
              <View style={[styles.placeIcon, { backgroundColor: getTypeColor(activeType) + '20' }]}>
                <Text style={{ fontSize: 18 }}>{getTypeIcon(activeType)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.placeName, { color: G.text }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.placeAddress, { color: G.sub }]} numberOfLines={1}>{item.address}</Text>
              </View>
              <Text style={[styles.dirBtn, { color: G.midGreen }]}>Navigate →</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  panel: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16,
    borderTopWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 10 },
    }),
  },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 14 },
  tabEmoji: { fontSize: 14 },
  tabText: { fontSize: 12, fontWeight: '700' },
  emptyText: { textAlign: 'center', paddingVertical: 20, fontSize: 14 },
  placeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16,
    marginBottom: 8, borderWidth: 1,
  },
  placeIcon: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  placeName: { fontSize: 14, fontWeight: '600' },
  placeAddress: { fontSize: 12, marginTop: 2 },
  dirBtn: { fontSize: 12, fontWeight: '700' },
});
