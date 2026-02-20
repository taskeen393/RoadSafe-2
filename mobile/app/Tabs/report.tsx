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
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reportService } from '../services';
import { ReportRequest } from '../services/types';

// ─── Theme tokens ───
const G = {
  bg: '#F4F7F4',
  card: '#FFFFFF',
  darkGreen: '#1A4D2E',
  midGreen: '#2D7A4D',
  lightGreen: '#E8F5ED',
  accent: '#E95B5B',
  text: '#1A1A1A',
  sub: '#6B7280',
  border: '#D1E8D9',
  inputBg: '#F9FBFA',
};


export default function ReportScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Incident type selection
  const incidentTypes = [
    { label: 'Accident', icon: 'car-crash', color: '#E95B5B' },
    { label: 'Flood', icon: 'water', color: '#3B9EE8' },
    { label: 'Landslide', icon: 'terrain', color: '#8B5CF6' },
    { label: 'Roadblock', icon: 'barrier', color: '#F59E0B' },
    { label: 'Other', icon: 'alert-circle-outline', color: '#6B7280' },
  ];
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) navigation?.replace?.('login');
      else {
        const userStr = await SecureStore.getItemAsync('user');
        if (userStr) setUser(JSON.parse(userStr).name);
      }
    };
    checkAuth();
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      setIsFetchingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      setLat(latitude); setLon(longitude);
      const rev = await Location.reverseGeocodeAsync({ latitude, longitude });
      setLocation(rev[0] ? `${rev[0].name}, ${rev[0].city}` : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    } catch {
      Alert.alert('Error', 'Failed to fetch location');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const pickImages = async () => {
    Alert.alert('Upload Image', 'Choose option', [
      {
        text: 'Camera', onPress: async () => {
          const r = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
          if (!r.canceled) setSelectedImages(p => [...p, ...r.assets.map(a => a.uri)]);
        }
      },
      {
        text: 'Gallery', onPress: async () => {
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, allowsMultipleSelection: true as any });
          if (!r.canceled) setSelectedImages(p => [...p, ...r.assets.map(a => a.uri)]);
        }
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickVideos = async () => {
    Alert.alert('Upload Video', 'Choose option', [
      {
        text: 'Camera', onPress: async () => {
          const r = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos });
          if (!r.canceled) setSelectedVideos(p => [...p, ...r.assets.map(a => a.uri)]);
        }
      },
      {
        text: 'Gallery', onPress: async () => {
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, allowsMultipleSelection: true as any });
          if (!r.canceled) setSelectedVideos(p => [...p, ...r.assets.map(a => a.uri)]);
        }
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const submitReport = async () => {
    if (!titleInput.trim()) {
      return Alert.alert('Missing Title', 'Please add a title for your report.');
    }
    if (!textInput.trim() && selectedImages.length === 0 && selectedVideos.length === 0) {
      return Alert.alert('Add something', 'Please add text, image or video before submitting.');
    }
    const token = await SecureStore.getItemAsync('token');
    if (!token) return Alert.alert('Not logged in');
    setIsSubmitting(true);

    const safeLocation = location || (lat ? `${lat.toFixed(4)}, ${lon?.toFixed(4)}` : 'Unknown location');
    const reportData: ReportRequest = {
      user, location: safeLocation, lat: lat ?? 0, lon: lon ?? 0,
      title: titleInput.trim(),
      description: textInput || 'No description',
      imageUris: selectedImages, videoUris: selectedVideos,
      dateTime: new Date().toISOString(),
    };

    try {
      await reportService.submitReport(reportData);
      setTextInput(''); setTitleInput(''); setSelectedImages([]); setSelectedVideos([]); setSelectedType('');
      Alert.alert('✅ Submitted', 'Your report has been sent successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.msg || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ─── Hero Header ─── */}
        <LinearGradient colors={[G.darkGreen, G.midGreen]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 16 }]}>
          {/* Decorative circles */}
          <View style={styles.heroDeco1} />
          <View style={styles.heroDeco2} />

          <View style={styles.heroContent}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="warning" size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Report Incident</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={13} color="rgba(255,255,255,0.7)" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {location || (isFetchingLocation ? 'Getting location...' : 'Location unavailable')}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.locRefreshBtn} onPress={getLocation}>
              <Ionicons name="refresh" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ─── Incident Type Pills ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Incident Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {incidentTypes.map((t) => (
              <TouchableOpacity
                key={t.label}
                style={[styles.typePill, selectedType === t.label && { backgroundColor: t.color, borderColor: t.color }]}
                onPress={() => setSelectedType(selectedType === t.label ? '' : t.label)}
              >
                <Ionicons name={t.icon as any} size={14} color={selectedType === t.label ? '#fff' : G.sub} />
                <Text style={[styles.typePillText, selectedType === t.label && { color: '#fff' }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ─── Description ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Incident Details</Text>
          <TextInput
            style={[styles.descInput, { minHeight: 50, marginBottom: 12 }]}
            placeholder="Title (e.g. Heavy Traffic at Main St)"
            placeholderTextColor={G.sub}
            value={titleInput}
            onChangeText={setTitleInput}
          />
          <TextInput
            style={styles.descInput}
            placeholder="Describe what happened..."
            placeholderTextColor={G.sub}
            value={textInput}
            onChangeText={setTextInput}
            multiline
            textAlignVertical="top"
            numberOfLines={5}
          />
        </View>

        {/* ─── Media Upload ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Attach Media</Text>

          <View style={styles.mediaRow}>
            {/* Images */}
            <TouchableOpacity style={styles.mediaBtn} onPress={pickImages} activeOpacity={0.8}>
              <View style={[styles.mediaBtnIcon, { backgroundColor: '#E8F5ED' }]}>
                <Ionicons name="images" size={22} color={G.midGreen} />
              </View>
              <Text style={styles.mediaBtnLabel}>Photos</Text>
              {selectedImages.length > 0 && (
                <View style={styles.mediaBadge}>
                  <Text style={styles.mediaBadgeText}>{selectedImages.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Videos */}
            <TouchableOpacity style={styles.mediaBtn} onPress={pickVideos} activeOpacity={0.8}>
              <View style={[styles.mediaBtnIcon, { backgroundColor: '#FEF3C7' }]}>
                <AntDesign name="video-camera" size={22} color="#D97706" />
              </View>
              <Text style={styles.mediaBtnLabel}>Videos</Text>
              {selectedVideos.length > 0 && (
                <View style={[styles.mediaBadge, { backgroundColor: '#D97706' }]}>
                  <Text style={styles.mediaBadgeText}>{selectedVideos.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Image Thumbnails */}
          {selectedImages.length > 0 && (
            <FlatList
              data={selectedImages}
              horizontal
              keyExtractor={(uri) => uri}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, marginTop: 12 }}
              renderItem={({ item, index }) => (
                <View style={styles.thumbWrap}>
                  <Image source={{ uri: item }} style={styles.thumb} />
                  <TouchableOpacity
                    style={styles.thumbRemove}
                    onPress={() => setSelectedImages(p => p.filter((_, i) => i !== index))}
                  >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          {selectedVideos.length > 0 && (
            <View style={styles.videoRow}>
              <Ionicons name="checkmark-circle" size={16} color={G.midGreen} />
              <Text style={styles.videoText}>{selectedVideos.length} video{selectedVideos.length > 1 ? 's' : ''} selected</Text>
            </View>
          )}
        </View>

        {/* ─── Submit Button ─── */}
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          <TouchableOpacity onPress={submitReport} disabled={isSubmitting} activeOpacity={0.88}>
            <LinearGradient
              colors={isSubmitting ? ['#9CA3AF', '#6B7280'] : [G.darkGreen, G.midGreen]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.submitBtn}
            >
              {isSubmitting ? (
                <Text style={styles.submitText}>Submitting...</Text>
              ) : (
                <>
                  <Ionicons name="paper-plane" size={20} color="#fff" />
                  <Text style={styles.submitText}>Submit Report</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Map Modal */}
      <Modal visible={mapVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: mapCoords?.lat || 24.8607,
              longitude: mapCoords?.lon || 67.0011,
              latitudeDelta: 0.05, longitudeDelta: 0.05,
            }}
          >
            {mapCoords && <Marker coordinate={{ latitude: mapCoords.lat, longitude: mapCoords.lon }} title="Reported Location" />}
          </MapView>
          <TouchableOpacity style={styles.closeMapBtn} onPress={() => setMapVisible(false)}>
            <Text style={styles.closeMapText}>✖  Close Map</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: G.bg,
  },

  // ─── Hero ───
  hero: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    overflow: 'hidden',
  },
  heroDeco1: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroDeco2: {
    position: 'absolute', bottom: -40, right: 60,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroContent: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  heroIconWrap: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: {
    fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4,
  },
  locationText: {
    fontSize: 12, color: 'rgba(255,255,255,0.7)', flex: 1,
  },
  locRefreshBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  // ─── Sections ───
  section: {
    paddingHorizontal: 20,
    marginTop: 22,
  },
  sectionLabel: {
    fontSize: 14, fontWeight: '700', color: G.text,
    marginBottom: 12, letterSpacing: -0.1,
  },

  // ─── Type Pills ───
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1.5,
    backgroundColor: G.card, borderColor: G.border,
  },
  typePillText: {
    fontSize: 13, fontWeight: '600', color: G.sub,
  },

  // ─── Floating Input ───
  inputWrapper: {
    backgroundColor: G.inputBg,
    borderRadius: 16, borderWidth: 1.5,
    borderColor: G.border,
    paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12,
  },
  inputWrapperFocused: {
    borderColor: G.midGreen,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: G.midGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  floatLabel: {
    position: 'absolute', left: 16, fontWeight: '500',
  },
  floatInput: {
    fontSize: 15, color: G.text, paddingVertical: 0, marginTop: 4,
  },

  // ─── Media ───
  mediaRow: {
    flexDirection: 'row', gap: 14,
  },
  mediaBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: G.card, borderRadius: 18,
    paddingVertical: 20, borderWidth: 1, borderColor: G.border,
    borderStyle: 'dashed',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  mediaBtnIcon: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  mediaBtnLabel: {
    fontSize: 13, fontWeight: '600', color: G.sub,
  },
  mediaBadge: {
    position: 'absolute', top: 8, right: 12,
    backgroundColor: G.midGreen, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  mediaBadgeText: {
    fontSize: 11, fontWeight: '700', color: '#fff',
  },

  // Thumbs
  thumbWrap: { position: 'relative' },
  thumb: {
    width: 90, height: 90, borderRadius: 14,
  },
  thumbRemove: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: G.accent, borderRadius: 12,
  },
  videoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    backgroundColor: G.lightGreen, padding: 10, borderRadius: 12,
  },
  videoText: {
    fontSize: 13, fontWeight: '600', color: G.midGreen,
  },

  // ─── Submit ───
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 18, paddingVertical: 18,
    ...Platform.select({
      ios: { shadowColor: G.darkGreen, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14 },
      android: { elevation: 8 },
    }),
  },
  submitText: {
    fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2,
  },

  // ─── Map modal ───
  closeMapBtn: {
    position: 'absolute', bottom: 40, alignSelf: 'center',
    backgroundColor: G.darkGreen, paddingVertical: 12,
    paddingHorizontal: 28, borderRadius: 24,
  },
  closeMapText: {
    color: '#fff', fontWeight: '700', fontSize: 15,
  },

  // Description input
  descInput: {
    backgroundColor: G.card,
    borderWidth: 1.5,
    borderColor: G.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: G.text,
    minHeight: 120,
    textAlignVertical: 'top',
    ...Platform.select({
      ios: { shadowColor: G.midGreen, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
});
