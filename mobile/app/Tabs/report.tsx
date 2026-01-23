// app/tabs/report.tsx
import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

// Import services
import { reportService, weatherService } from '../services';
import { ReportRequest } from '../services/types';

export default function ReportScreen({ navigation }: any) {
  const [user, setUser] = useState<string>('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [textInput, setTextInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ AUTH CHECK ON LOAD
  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        navigation.replace('login');
      } else {
        const userStr = await SecureStore.getItemAsync('user');
        if (userStr) setUser(JSON.parse(userStr).name);
      }
    };
    checkAuth();
  }, []);
  const getLocation = async () => {
    try {
      setIsFetchingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('✅ Location permission status:', status);
      const enabled = await Location.hasServicesEnabledAsync();
console.log('Location services enabled:', enabled);
      if (status !== 'granted') {
        setLocationError('Permission denied');
        Alert.alert('Permission denied', 'Please enable location permission in your device settings.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;

      console.log('✅ Location fetched:', latitude, longitude);
      setLat(latitude);
      setLon(longitude);

      const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
      console.log('✅ Reverse geocoded:', reverse);
      const locStr = reverse[0]
        ? `${reverse[0].name}, ${reverse[0].city}, ${reverse[0].country}`
        : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      console.log('✅ Location string:', locStr);
      setLocation(locStr);
    } catch (err) {
      console.log('❌ Location fetch error:', err);
      Alert.alert('Error', 'Failed to fetch location');
      setLocationError('Failed to fetch location');
    } finally {
      setIsFetchingLocation(false);
    }
  };


  useEffect(() => {
    getLocation();
  }, []);

  // 📷 Pick Images / Camera
  const pickImages = async () => {
    Alert.alert(
      'Upload Image',
      'Choose option',
      [
        {
          text: 'Camera',
          onPress: async () => {
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.6,
            });
            if (!result.canceled && result.assets?.length) {
              const uris = result.assets.map(a => a.uri);
              setSelectedImages(prev => [...prev, ...uris]);
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.6,
              allowsMultipleSelection: true as any,
            });
            if (!result.canceled && result.assets?.length) {
              const uris = result.assets.map(a => a.uri);
              setSelectedImages(prev => [...prev, ...uris]);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // 🎬 Pick Videos / Camera
  const pickVideos = async () => {
    Alert.alert(
      'Upload Video',
      'Choose option',
      [
        {
          text: 'Camera',
          onPress: async () => {
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            });
            if (!result.canceled && result.assets?.length) {
              const uris = result.assets.map(a => a.uri);
              setSelectedVideos(prev => [...prev, ...uris]);
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Videos,
              allowsMultipleSelection: true as any,
            });
            if (!result.canceled && result.assets?.length) {
              const uris = result.assets.map(a => a.uri);
              setSelectedVideos(prev => [...prev, ...uris]);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // ✅ Submit report using reportService
  const submitReport = async () => {
    // If location isn't ready yet, retry once to avoid a "stuck" UX
    if (lat === null || lon === null) {
      await getLocation();
      // Wait a bit for location to be set
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!textInput.trim() && selectedImages.length === 0 && selectedVideos.length === 0) {
      Alert.alert('Add something', 'Please add text, image or video before submitting.');
      return;
    }

    const token = await SecureStore.getItemAsync('token');
    if (!token) return Alert.alert('Not logged in');

    setIsSubmitting(true);

    // Ensure location is set - use coordinates if location string is empty
    let safeLocation = location;
    if (!safeLocation || safeLocation.trim() === '' || safeLocation === 'Unknown location') {
      if (lat !== null && lon !== null) {
        safeLocation = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      } else {
        safeLocation = 'Unknown location';
      }
    }
    const safeLat = lat ?? 0;
    const safeLon = lon ?? 0;

    const reportData: ReportRequest = {
      user,
      location: safeLocation,
      lat: safeLat,
      lon: safeLon,
      title: textInput.slice(0, 30) || 'No title',
      description: textInput || 'No description',
      imageUris: selectedImages,
      videoUris: selectedVideos,
      dateTime: new Date().toISOString(),
    };

    if (__DEV__) {
      console.log('📤 Submitting report:', {
        location: safeLocation,
        lat: safeLat,
        lon: safeLon,
        hasLocation: !!location,
        locationState: location,
      });
    }

    try {
      await reportService.submitReport(reportData);

      setTextInput('');
      setSelectedImages([]);
      setSelectedVideos([]);
      Alert.alert('Success', 'Your report has been added!');
    } catch (err: any) {
      console.log('Report submit error:', err);
      Alert.alert('Error', err.msg || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={['#E8F5E9', '#F9FFF9']} style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AntDesign name="alert" size={28} color="#2E8B57" style={{ marginRight: 8 }} />
            <Text style={styles.title}>Report Incident</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <FontAwesome name="map-marker" size={18} color="#2E8B57" style={{ marginRight: 5 }} />
            <Text style={styles.locationText}>
              Your Location:{' '}
              {location
                ? location
                : isFetchingLocation
                  ? 'Fetching...'
                  : locationError
                    ? 'Unavailable'
                    : 'Fetching...'}
            </Text>
          </View>
        </View>

        {/* Report Form */}
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Describe what happened..."
            value={textInput}
            onChangeText={setTextInput}
            multiline
          />

          <TouchableOpacity style={styles.button} onPress={pickImages}>
            <Ionicons name="images-sharp" size={20} color="#2E8B57" style={{ marginRight: 5 }} />
            <Text style={styles.buttonText}>Upload Image</Text>
          </TouchableOpacity>

          {selectedImages.length > 0 && (
            <FlatList
              data={selectedImages}
              horizontal
              keyExtractor={(uri) => uri}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => <Image source={{ uri: item }} style={styles.selectedThumb} />}
              style={{ marginVertical: 8 }}
            />
          )}

          <TouchableOpacity style={styles.button} onPress={pickVideos}>
            <AntDesign name="video-camera-add" size={20} color="#2E8B57" style={{ marginRight: 5 }} />
            <Text style={styles.buttonText}>Upload Video</Text>
          </TouchableOpacity>

          {selectedVideos.length > 0 && (
            <View style={{ marginTop: 8, marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark-done-circle-sharp" size={18} color="#2E7D32" style={{ marginRight: 5 }} />
              <Text style={styles.selectedText}>{selectedVideos.length} video(s) selected</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
            onPress={submitReport}
            disabled={isSubmitting}
          >
            <Ionicons name="checkmark-done-circle-sharp" size={20} color="#fff" style={{ marginRight: 5 }} />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MAP MODAL */}
      <Modal visible={mapVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: mapCoords?.lat || 24.8607,
              longitude: mapCoords?.lon || 67.0011,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {mapCoords && <Marker coordinate={{ latitude: mapCoords.lat, longitude: mapCoords.lon }} title="Reported Location" />}
          </MapView>

          <TouchableOpacity style={styles.closeMapBtn} onPress={() => setMapVisible(false)}>
            <Text style={styles.closeMapText}>✖ Close Map</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 15, marginTop: 50, marginBottom: 0 },
  header: { alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2E8B57' },
  locationText: { fontSize: 14, color: '#336B48' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 20,
    shadowColor: '#2E8B57',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#F0FFF0',
    borderRadius: 15,
    padding: 15,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#E6F4EA',
    padding: 14,
    borderRadius: 15,
    alignItems: 'center',
    marginVertical: 6,
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#2E8B57' },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#2E8B57',
    padding: 14,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  selectedThumb: { width: 110, height: 110, borderRadius: 12, marginRight: 8 },
  selectedText: { fontSize: 14, color: '#2E7D32', fontWeight: '600' },

  closeMapBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#2E8B57', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 25 },
  closeMapText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
