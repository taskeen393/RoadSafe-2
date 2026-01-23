import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

// Import SOS service
import { sosService } from '../services';
import { Place } from '../services/types';

const TYPES = ['hospital', 'police', 'fire_station'];

export default function TrackScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedType, setSelectedType] = useState<string>('hospital');
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Get user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access is needed');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  // Fetch nearby places when location or type changes
  useEffect(() => {
    if (location) fetchNearbyPlaces();
  }, [location, selectedType]);

  const fetchNearbyPlaces = async () => {
    if (!location) return;

    setLoading(true);
    try {
      const results = await sosService.getNearbyPlaces(
        location.latitude,
        location.longitude,
        selectedType
      );
      setPlaces(results);
      if (results.length > 0) zoomToMarkers(results);
    } catch (error: any) {
      Alert.alert('Error', error.msg || 'Unable to fetch nearby places');
    } finally {
      setLoading(false);
    }
  };

  const zoomToMarkers = (markers: Place[]) => {
    if (!mapRef.current) return;
    const coords = markers.map(m => ({
      latitude: m.geometry.location.lat,
      longitude: m.geometry.location.lng,
    }));
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 80, bottom: 300, left: 80 },
      animated: true,
    });
  };

  const callPlace = async (placeId: string) => {
    try {
      const phone = await sosService.getPlacePhoneNumber(placeId);
      if (!phone) return Alert.alert('Phone not available');

      const supported = await Linking.canOpenURL(`tel:${phone}`);
      if (supported) Linking.openURL(`tel:${phone}`);
    } catch {
      Alert.alert('Error', 'Call failed');
    }
  };

  // SOS Button → call emergency number + send to backend
  const sosCall = async () => {
    // Direct emergency call
    const supported = await Linking.canOpenURL('tel:15');
    if (supported) Linking.openURL('tel:15');

    // Send SOS to backend using sosService
    try {
      await sosService.sendSOSAlert({ user: 'User1', message: 'SOS activated!' });
      Alert.alert('SOS Sent', 'Emergency reported to system');
    } catch (error: any) {
      console.error('Backend error:', error);
    }
  };

  if (!location) return <Text style={styles.loading}>Fetching Location...</Text>;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      >
        {places.map(place => (
          <Marker
            key={place.place_id}
            coordinate={{
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            }}
            title={place.name}
            description={place.vicinity}
          />
        ))}
      </MapView>

      {/* Filters */}
      <View style={styles.filters}>
        {TYPES.map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.filterBtn, selectedType === type && styles.selectedFilter]}
            onPress={() => setSelectedType(type)}
          >
            <Text style={[styles.filterText, selectedType === type && { color: 'white' }]}>
              {type.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SOS Button */}
      <TouchableOpacity style={styles.sosBtn} onPress={sosCall}>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>

      {/* Bottom List */}
      <View style={styles.bottomList}>
        {loading ? (
          <Text style={{ padding: 20, textAlign: 'center' }}>Loading...</Text>
        ) : (
          <FlatList
            data={places}
            keyExtractor={item => item.place_id}
            renderItem={({ item }) => (
              <View style={styles.placeItem}>
                <View>
                  <Text style={styles.placeName}>{item.name}</Text>
                  <Text style={styles.placeVicinity}>{item.vicinity}</Text>
                </View>
                <TouchableOpacity style={styles.callBtn} onPress={() => callPlace(item.place_id)}>
                  <Text style={{ color: 'white' }}>Call</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loading: { flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 18 },
  filters: { position: 'absolute', top: 50, left: 10, flexDirection: 'row' },
  filterBtn: { backgroundColor: 'white', padding: 10, marginRight: 8, borderRadius: 10 },
  selectedFilter: { backgroundColor: 'blue' },
  filterText: { fontWeight: 'bold' },
  sosBtn: { position: 'absolute', right: 20, bottom: 280, backgroundColor: 'red', width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  sosText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  bottomList: { position: 'absolute', bottom: 0, width: '100%', maxHeight: 250, backgroundColor: 'white' },
  placeItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 0.5, borderColor: '#ccc' },
  placeName: { fontSize: 16, fontWeight: 'bold' },
  placeVicinity: { color: '#555' },
  callBtn: { backgroundColor: 'green', padding: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});
