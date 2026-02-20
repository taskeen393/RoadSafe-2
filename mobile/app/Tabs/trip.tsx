// app/Tabs/trip.tsx — Track Trip (Light + Dark Green Theme)
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useRef, useState } from "react";
import {
  Alert,
  Dimensions,
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
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Theme ───
const G = {
  bg: '#F4F7F4',
  card: '#FFFFFF',
  darkGreen: '#1A4D2E',
  midGreen: '#2D7A4D',
  lightGreen: '#E8F5ED',
  text: '#1A1A1A',
  sub: '#6B7280',
  border: '#D1E8D9',
  red: '#E95B5B',
};

interface Review {
  id: string;
  route: { latitude: number; longitude: number }[];
  text?: string;
  images?: string[];
  videos?: string[];
}

const { width, height } = Dimensions.get("window");

export default function TripScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"give" | "view">("give");
  const [tracking, setTracking] = useState(false);
  const [route, setRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [textInput, setTextInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [activeMediaList, setActiveMediaList] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeIsVideo, setActiveIsVideo] = useState(false);
  const locationWatcher = useRef<any>(null);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const startTravel = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission denied", "Location permission is required!");
    setTracking(true); setRoute([]);
    locationWatcher.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 3 },
      (loc) => {
        const coords = loc.coords;
        setLocation(coords);
        setRoute((prev) => {
          if (prev.length === 0) return [coords];
          const last = prev[prev.length - 1];
          return getDistance(last.latitude, last.longitude, coords.latitude, coords.longitude) > 10
            ? [...prev, coords] : prev;
        });
      }
    );
  };

  const stopTravel = () => {
    locationWatcher.current?.remove();
    locationWatcher.current = null;
    setTracking(false);
    Alert.alert("Trip Stopped", "You can now write your review.");
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.5 });
    if (!result.canceled) setImages([...images, ...result.assets.map(a => a.uri)]);
  };

  const pickVideos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, allowsMultipleSelection: true });
    if (!result.canceled) setVideos([...videos, ...result.assets.map(a => a.uri)]);
  };

  const removeMedia = (type: "image" | "video", index: number) => {
    if (type === "image") setImages(images.filter((_, i) => i !== index));
    else setVideos(videos.filter((_, i) => i !== index));
  };

  const submitReview = () => {
    if (route.length === 0) return Alert.alert("No Route", "Start and stop a trip before submitting!");
    setReviews([{ id: Date.now().toString(), route, text: textInput, images: images.length ? images : undefined, videos: videos.length ? videos : undefined }, ...reviews]);
    setRoute([]); setTextInput(""); setImages([]); setVideos([]);
    Alert.alert("✅ Submitted", "Your trip review has been saved!");
  };

  const openReviewMap = (r: Review) => { setSelectedReview(r); setModalVisible(true); };
  const openMedia = (uris: string[], index = 0, isVideo = false) => {
    setActiveMediaList(uris); setActiveIndex(index); setActiveIsVideo(isVideo); setMediaModalVisible(true);
  };
  const getItemLayout = (_: any, index: number) => ({ length: width, offset: width * index, index });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ─── Hero Header ─── */}
      <LinearGradient colors={[G.darkGreen, G.midGreen]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={styles.heroDeco} />
        <View style={styles.heroRow}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="navigate" size={22} color="#fff" />
          </View>
          <View>
            <Text style={styles.heroTitle}>Track Trip</Text>
            <Text style={styles.heroSub}>Record & review your journeys</Text>
          </View>
        </View>

        {/* Mode Toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity style={[styles.toggleBtn, mode === 'give' && styles.toggleActive]} onPress={() => setMode('give')}>
            <Ionicons name="map" size={14} color={mode === 'give' ? '#fff' : G.midGreen} />
            <Text style={[styles.toggleText, mode === 'give' && { color: '#fff' }]}>Record Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, mode === 'view' && styles.toggleActive]} onPress={() => setMode('view')}>
            <Ionicons name="list" size={14} color={mode === 'view' ? '#fff' : G.midGreen} />
            <Text style={[styles.toggleText, mode === 'view' && { color: '#fff' }]}>My Reviews</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
        {mode === 'give' && (
          <>
            {/* Map */}
            <View style={styles.mapWrapper}>
              <MapView
                style={styles.map}
                initialRegion={{ latitude: location?.latitude || 24.8607, longitude: location?.longitude || 67.0011, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
              >
                {location && <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} />}
                {route.length > 0 && <Polyline coordinates={route} strokeColor={G.darkGreen} strokeWidth={4} />}
              </MapView>
              {tracking && (
                <View style={styles.liveTag}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
            </View>

            {/* Start / Stop */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: tracking ? '#9CA3AF' : G.darkGreen }]}
                onPress={startTravel} disabled={tracking}
              >
                <Ionicons name="play" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Start Trip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: tracking ? G.red : '#D1D5DB' }]}
                onPress={stopTravel} disabled={!tracking}
              >
                <Ionicons name="stop" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Stop Trip</Text>
              </TouchableOpacity>
            </View>

            {/* Review Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Write a Review</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="How was the road? Any hazards?"
                placeholderTextColor={G.sub}
                value={textInput}
                onChangeText={setTextInput}
                multiline
                textAlignVertical="top"
                numberOfLines={4}
              />

              {/* Media Buttons */}
              <View style={styles.mediaRow}>
                <TouchableOpacity style={styles.mediaBtn} onPress={pickImages}>
                  <View style={[styles.mediaBtnIcon, { backgroundColor: G.lightGreen }]}>
                    <Ionicons name="images" size={20} color={G.midGreen} />
                  </View>
                  <Text style={styles.mediaBtnLabel}>Photos{images.length > 0 ? ` (${images.length})` : ''}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaBtn} onPress={pickVideos}>
                  <View style={[styles.mediaBtnIcon, { backgroundColor: '#FEF3C7' }]}>
                    <AntDesign name="video-camera-add" size={20} color="#D97706" />
                  </View>
                  <Text style={styles.mediaBtnLabel}>Videos{videos.length > 0 ? ` (${videos.length})` : ''}</Text>
                </TouchableOpacity>
              </View>

              {/* Thumbnails */}
              {(images.length > 0 || videos.length > 0) && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 12 }}>
                  {images.map((uri, i) => (
                    <View key={`img-${i}`} style={styles.thumbWrap}>
                      <TouchableOpacity onPress={() => openMedia(images, i, false)}>
                        <Image source={{ uri }} style={styles.thumb} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.thumbRemove} onPress={() => removeMedia("image", i)}>
                        <Ionicons name="close-circle" size={20} color={G.red} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {videos.map((uri, i) => (
                    <View key={`vid-${i}`} style={styles.thumbWrap}>
                      <TouchableOpacity onPress={() => openMedia(videos, i, true)} style={styles.videoThumb}>
                        <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.videoThumbText}>Video</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.thumbRemove} onPress={() => removeMedia("video", i)}>
                        <Ionicons name="close-circle" size={20} color={G.red} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Submit */}
              <TouchableOpacity onPress={submitReview} activeOpacity={0.88} style={{ marginTop: 18 }}>
                <LinearGradient colors={[G.darkGreen, G.midGreen]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
                  <Ionicons name="paper-plane" size={18} color="#fff" />
                  <Text style={styles.submitText}>Submit Review</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ─── View Reviews ─── */}
        {mode === 'view' && (
          <View style={styles.section}>
            {reviews.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="map-outline" size={50} color={G.border} />
                <Text style={styles.emptyTitle}>No trips yet</Text>
                <Text style={styles.emptySub}>Record your first trip to see it here</Text>
              </View>
            ) : reviews.map((r) => {
              const mid = Math.floor(r.route.length / 2);
              const midPt = r.route[mid] || r.route[0];
              return (
                <TouchableOpacity key={r.id} onPress={() => openReviewMap(r)} activeOpacity={0.85} style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <View style={styles.reviewIconWrap}>
                      <Ionicons name="navigate-circle" size={20} color={G.midGreen} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewCardTitle}>Trip #{r.id.slice(-4)}</Text>
                      <Text style={styles.reviewCardSub}>{r.route.length} waypoints recorded</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={G.sub} />
                  </View>

                  {r.route.length > 1 && (
                    <MapView
                      style={styles.smallMap}
                      initialRegion={{ latitude: midPt.latitude, longitude: midPt.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
                      scrollEnabled={false} zoomEnabled={false} pointerEvents="none"
                    >
                      <Polyline coordinates={r.route} strokeColor={G.darkGreen} strokeWidth={3} />
                    </MapView>
                  )}

                  {r.text ? (
                    <View style={styles.reviewText}>
                      <Ionicons name="chatbubble-ellipses-outline" size={14} color={G.midGreen} />
                      <Text style={styles.reviewTextContent} numberOfLines={2}>{r.text}</Text>
                    </View>
                  ) : null}

                  {(r.images?.length || r.videos?.length) ? (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      {r.images?.slice(0, 3).map((uri, i) => (
                        <TouchableOpacity key={i} onPress={() => openMedia(r.images!, i, false)}>
                          <Image source={{ uri }} style={styles.reviewThumb} />
                        </TouchableOpacity>
                      ))}
                      {r.videos?.slice(0, 2).map((uri, i) => (
                        <TouchableOpacity key={i} onPress={() => openMedia(r.videos!, i, true)} style={styles.reviewVideoThumb}>
                          <Ionicons name="play" size={18} color="#fff" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ─── Review Map Modal ─── */}
      {selectedReview && (
        <Modal visible={modalVisible} animationType="slide">
          <View style={{ flex: 1 }}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={{ latitude: selectedReview.route[0].latitude, longitude: selectedReview.route[0].longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
            >
              <Polyline coordinates={selectedReview.route} strokeColor={G.darkGreen} strokeWidth={4} />
            </MapView>
            <TouchableOpacity style={styles.closeMapBtn} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={18} color="#fff" />
              <Text style={styles.closeMapText}>Close Map</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* ─── Fullscreen Media Modal ─── */}
      <Modal visible={mediaModalVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity style={styles.mediaClose} onPress={() => setMediaModalVisible(false)}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          {!activeIsVideo ? (
            <FlatList horizontal pagingEnabled data={activeMediaList} keyExtractor={(u, i) => `${u}-${i}`}
              getItemLayout={getItemLayout} initialScrollIndex={activeIndex}
              renderItem={({ item }) => <Image source={{ uri: item }} style={{ width, height: height - 80, resizeMode: 'contain' }} />}
            />
          ) : (
            <FlatList horizontal pagingEnabled data={activeMediaList} keyExtractor={(u, i) => `${u}-${i}`}
              getItemLayout={getItemLayout} initialScrollIndex={activeIndex}
              renderItem={({ item }) => <Video source={{ uri: item }} style={{ width, height: height - 80 }} useNativeControls resizeMode={ResizeMode.CONTAIN} shouldPlay />}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: G.bg },

  // Hero
  hero: { paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden' },
  heroDeco: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  heroIconWrap: { width: 46, height: 46, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  // Toggle
  toggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 4, gap: 4 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 13, gap: 6 },
  toggleActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  toggleText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },

  // Map
  mapWrapper: { margin: 16, borderRadius: 20, overflow: 'hidden', position: 'relative', ...Platform.select({ ios: { shadowColor: G.darkGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }, android: { elevation: 5 } }) },
  map: { width: '100%', height: 260 },
  liveTag: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: G.red, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  // Buttons
  btnRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 }, android: { elevation: 5 } }) },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Section
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: G.text, marginBottom: 12 },

  // Review Input
  reviewInput: { backgroundColor: G.card, borderRadius: 16, borderWidth: 1.5, borderColor: G.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: G.text, minHeight: 100 },

  // Media
  mediaRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  mediaBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: G.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: G.border, borderStyle: 'dashed' },
  mediaBtnIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  mediaBtnLabel: { fontSize: 13, fontWeight: '600', color: G.sub },
  thumbWrap: { position: 'relative' },
  thumb: { width: 85, height: 85, borderRadius: 12 },
  videoThumb: { width: 85, height: 85, borderRadius: 12, backgroundColor: '#1A2E4A', justifyContent: 'center', alignItems: 'center', gap: 4 },
  videoThumbText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  thumbRemove: { position: 'absolute', top: -6, right: -6 },

  // Submit
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 18, ...Platform.select({ ios: { shadowColor: G.darkGreen, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14 }, android: { elevation: 8 } }) },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Review Cards
  reviewCard: { backgroundColor: G.card, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: G.border, ...Platform.select({ ios: { shadowColor: G.darkGreen, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 }, android: { elevation: 3 } }) },
  reviewCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  reviewIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: G.lightGreen, justifyContent: 'center', alignItems: 'center' },
  reviewCardTitle: { fontSize: 15, fontWeight: '700', color: G.text },
  reviewCardSub: { fontSize: 12, color: G.sub, marginTop: 2 },
  smallMap: { width: '100%', height: 140, borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  reviewText: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: G.lightGreen, padding: 10, borderRadius: 10 },
  reviewTextContent: { flex: 1, fontSize: 13, color: G.midGreen, lineHeight: 18 },
  reviewThumb: { width: 70, height: 70, borderRadius: 10 },
  reviewVideoThumb: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#1A2E4A', justifyContent: 'center', alignItems: 'center' },

  // Empty state
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: G.text },
  emptySub: { fontSize: 13, color: G.sub, textAlign: 'center' },

  // Modals
  closeMapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: G.darkGreen, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 24 },
  closeMapText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  mediaClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.15)', padding: 8, borderRadius: 20 },
});
