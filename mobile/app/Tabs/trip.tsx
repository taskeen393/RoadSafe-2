import { AntDesign, Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

interface Review {
  id: string;
  route: { latitude: number; longitude: number }[];
  text?: string;
  images?: string[];
  videos?: string[];
}

const { width, height } = Dimensions.get("window");

export default function TripScreen() {
  const [mode, setMode] = useState<"give" | "view">("give");
  const [tracking, setTracking] = useState(false);
  const [route, setRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [textInput, setTextInput] = useState("");

  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  const [viewPressed, setViewPressed] = useState(false);
  const [stopPressed, setStopPressed] = useState(false);

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [activeMediaList, setActiveMediaList] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeIsVideo, setActiveIsVideo] = useState(false);

  const locationWatcher = useRef<any>(null);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Start tracking
  const startTravel = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Location permission is required!");
      return;
    }
    setTracking(true);
    setRoute([]);
    locationWatcher.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 3 },
      (loc) => {
        const coords = loc.coords;
        setLocation(coords);
        setRoute((prev) => {
          if (prev.length === 0) return [coords];
          const last = prev[prev.length - 1];
          const dist = getDistance(last.latitude, last.longitude, coords.latitude, coords.longitude);
          if (dist > 10) return [...prev, coords];
          return prev;
        });
      }
    );
  };

  // Stop tracking
  const stopTravel = () => {
    if (locationWatcher.current) {
      locationWatcher.current.remove();
      locationWatcher.current = null;
    }
    setTracking(false);
    Alert.alert("Travel stopped", "Now you can write your review.");
  };

  // Pick multiple images
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Media library permission is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.5,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map((a) => a.uri);
      setImages([...images, ...uris]);
    }
  };

  // Pick multiple videos
  const pickVideos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Media library permission is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map((a) => a.uri);
      setVideos([...videos, ...uris]);
    }
  };

  const removeMedia = (type: "image" | "video", index: number) => {
    if (type === "image") setImages(images.filter((_, i) => i !== index));
    else setVideos(videos.filter((_, i) => i !== index));
  };

  const submitReview = () => {
    if (route.length === 0) {
      Alert.alert("Error", "Start and stop travel before submitting review!");
      return;
    }
    const newReview: Review = {
      id: Date.now().toString(),
      route,
      text: textInput,
      images: images.length > 0 ? images : undefined,
      videos: videos.length > 0 ? videos : undefined,
    };
    setReviews([newReview, ...reviews]);
    setRoute([]);
    setTextInput("");
    setImages([]);
    setVideos([]);
    Alert.alert("Success", "Review submitted!");
  };

  const openReviewMap = (review: Review) => {
    setSelectedReview(review);
    setModalVisible(true);
  };

  const openMedia = (uris: string[], index = 0, isVideo = false) => {
    setActiveMediaList(uris);
    setActiveIndex(index);
    setActiveIsVideo(isVideo);
    setMediaModalVisible(true);
  };

  const getItemLayout = (_data: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  });

  return (
    <View style={styles.container}>
      {/* Toggle buttons */}
      <View style={styles.toggle}>
        <TouchableOpacity
          onPressIn={() => setMode("give")}
          style={[styles.modeButton, mode === "give" && { backgroundColor: "#2E8B57" }]}
        >
          <Text style={[styles.modeText, mode === "give" && { color: "#fff" }]}>Give Review</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPressIn={() => {
            setMode("view");
            setViewPressed(true);
          }}
          onPressOut={() => setViewPressed(false)}
          style={[styles.modeButton, { backgroundColor: viewPressed || mode === "view" ? "#1E90FF" : "#ccc" }]}
        >
          <Text style={styles.modeText}>View Reviews</Text>
        </TouchableOpacity>
      </View>

      {/* Map for giving review */}
      {mode === "give" && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location?.latitude || 24.8607,
            longitude: location?.longitude || 67.0011,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {location && <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} />}
          {route.length > 0 && <Polyline coordinates={route} strokeColor="#2E8B57" strokeWidth={4} />}
        </MapView>
      )}

      <ScrollView style={styles.bottomPanel}>
        {mode === "give" && (
          <>
            {/* Start / Stop */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: tracking ? "#9acd32" : "#2E8B57" }]}
                onPress={startTravel}
                disabled={tracking}
              >
                <Text style={styles.buttonText}>Start</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPressIn={() => setStopPressed(true)}
                onPressOut={() => setStopPressed(false)}
                style={[styles.stopButton, { backgroundColor: stopPressed ? "#FF4500" : "#FF6347" }]}
                onPress={stopTravel}
                disabled={!tracking}
              >
                <Text style={styles.buttonText}>Stop</Text>
              </TouchableOpacity>
            </View>

            {/* Review text */}
            <TextInput
              style={styles.input}
              placeholder="Write your review..."
              value={textInput}
              onChangeText={setTextInput}
              multiline
            />

            {/* Media buttons */}
            <View style={styles.mediaButtons}>
              <TouchableOpacity style={styles.pickButton} onPress={pickImages}>
                <Ionicons name="images-sharp" size={18} color="#2E8B57" style={{ marginRight: 5 }} />
                <Text style={styles.pickText}>Pick Images</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pickButton} onPress={pickVideos}>
                <AntDesign name="video-camera-add" size={18} color="#2E8B57" style={{ marginRight: 5 }} />
                <Text style={styles.pickText}>Pick Videos</Text>
              </TouchableOpacity>
            </View>

            {/* Display selected images */}
            <View style={styles.selectedMediaContainer}>
              {images.map((uri, i) => (
                <View key={i} style={styles.thumbWrapper}>
                  <Image source={{ uri }} style={styles.previewThumb} />
                  <TouchableOpacity style={styles.crossButton} onPress={() => removeMedia("image", i)}>
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>✖</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    onPress={() => openMedia(images, i, false)}
                  />
                </View>
              ))}

              {videos.map((uri, i) => (
                <View key={i} style={styles.thumbWrapper}>
                  <View style={[styles.videoThumb, { justifyContent: "center", alignItems: "center" }]}>
                    <Text style={{ color: "#fff", fontWeight: "700" }}>▶ Video</Text>
                  </View>
                  <TouchableOpacity style={styles.crossButton} onPress={() => removeMedia("video", i)}>
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>✖</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => openMedia(videos, i, true)} />
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={submitReview}>
              <Ionicons name="checkmark-done-circle-sharp" size={18} color="#fff" style={{ marginRight: 5 }} />
              <Text style={styles.submitText}>Submit Review</Text>
            </TouchableOpacity>
          </>
        )}

        {/* View Reviews */}
        {mode === "view" &&
          reviews.map((r) => {
            const firstPoint = r.route[0];
            const lastPoint = r.route[r.route.length - 1];
            return (
              <TouchableOpacity key={r.id} onPress={() => openReviewMap(r)} activeOpacity={0.8}>
                <View style={styles.reviewCard}>
                  <Text style={{ fontWeight: "bold", color: "#2E8B57" }}>Route ID: {r.id}</Text>

                  <MapView
                    style={styles.smallMap}
                    initialRegion={{
                      latitude: (firstPoint.latitude + lastPoint.latitude) / 2 || 24.8607,
                      longitude: (firstPoint.longitude + lastPoint.longitude) / 2 || 67.0011,
                      latitudeDelta: Math.abs(firstPoint.latitude - lastPoint.latitude) + 0.01,
                      longitudeDelta: Math.abs(firstPoint.longitude - lastPoint.longitude) + 0.01,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                  >
                    <Polyline coordinates={r.route} strokeColor="#2E8B57" strokeWidth={3} />
                  </MapView>

                  {r.text && (
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="document-text-sharp" size={16} color="#336B48" style={{ marginRight: 5 }} />
                      <Text style={{ color: "#336B48" }}>{r.text}</Text>
                    </View>
                  )}

                  {/* Images */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {r.images?.map((uri, i) => (
                      <TouchableOpacity key={i} onPress={() => openMedia(r.images!, i, false)}>
                        <Image source={{ uri }} style={styles.previewThumb} />
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Videos */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {r.videos?.map((uri, i) => (
                      <TouchableOpacity key={i} onPress={() => openMedia(r.videos!, i, true)}>
                        <View style={styles.videoThumb}>
                          <Text style={{ color: "#fff", fontWeight: "700" }}>▶ Video</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>

      {/* Review map modal */}
      {selectedReview && (
        <Modal visible={modalVisible} animationType="slide">
          <View style={{ flex: 1 }}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: selectedReview.route[0].latitude,
                longitude: selectedReview.route[0].longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              <Polyline coordinates={selectedReview.route} strokeColor="#2E8B57" strokeWidth={4} />
            </MapView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Close Map</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* Fullscreen media modal */}
      <Modal visible={mediaModalVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setMediaModalVisible(false)}>
            <Text style={{ color: "#fff", fontSize: 18 }}>✖ Close</Text>
          </TouchableOpacity>

          {!activeIsVideo ? (
            <FlatList
              horizontal
              pagingEnabled
              data={activeMediaList}
              keyExtractor={(u, i) => `${u}-${i}`}
              getItemLayout={getItemLayout}
              initialScrollIndex={activeIndex}
              renderItem={({ item }) => <Image source={{ uri: item }} style={{ width, height: height - 80, resizeMode: "contain" }} />}
            />
          ) : (
            <FlatList
              horizontal
              pagingEnabled
              data={activeMediaList}
              keyExtractor={(u, i) => `${u}-${i}`}
              getItemLayout={getItemLayout}
              initialScrollIndex={activeIndex}
              renderItem={({ item }) => (
                <Video
                  source={{ uri: item }}
                  style={{ width, height: height - 80 }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                />
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FFF9", paddingHorizontal: 15, marginTop: 50, marginBottom: 0 },
  map: { width: Dimensions.get("window").width, height: 300 },
  bottomPanel: { flex: 1, padding: 10, backgroundColor: "#E6F4EA" },
  toggle: { flexDirection: "row", justifyContent: "space-around", marginVertical: 10 },
  modeButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  modeText: { fontWeight: "600", fontSize: 15, color: "#000" },
  buttonRow: { flexDirection: "row", justifyContent: "space-around", marginVertical: 10 },
  startButton: { paddingVertical: 10, paddingHorizontal: 30, borderRadius: 10 },
  stopButton: { paddingVertical: 10, paddingHorizontal: 30, borderRadius: 10 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  input: { backgroundColor: "#fff", borderRadius: 10, padding: 10, minHeight: 60, marginBottom: 10 },
  mediaButtons: { marginBottom: 10 },
  pickButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#CDEFD5", borderRadius: 8, padding: 10, marginVertical: 5 },
  pickText: { textAlign: "center", color: "#2E8B57", fontWeight: "600" },
  selectedMediaContainer: { flexDirection: "row", flexWrap: "wrap" },
  thumbWrapper: { position: "relative", margin: 5 },
  previewThumb: { width: 100, height: 80, borderRadius: 8 },
  videoThumb: { width: 100, height: 80, borderRadius: 8, backgroundColor: "#333", justifyContent: "center", alignItems: "center" },
  crossButton: { position: "absolute", top: -5, right: -5, backgroundColor: "#FF4500", borderRadius: 12, width: 24, height: 24, justifyContent: "center", alignItems: "center" },
  submitButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#2E8B57", borderRadius: 10, padding: 12, marginTop: 10 },
  submitText: { color: "#fff", textAlign: "center", fontWeight: "bold", marginLeft: 5 },
  reviewCard: { backgroundColor: "#fff", padding: 10, borderRadius: 12, marginBottom: 15, shadowColor: "#2E8B57", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  smallMap: { width: "100%", height: 150, marginVertical: 5 },
  closeButton: { backgroundColor: "#2E8B57", padding: 15, alignItems: "center" },
  modalClose: { position: "absolute", top: 40, right: 20, zIndex: 10 },
});
