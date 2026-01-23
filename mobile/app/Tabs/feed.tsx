// app/feed.tsx
import { Entypo, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

// Import report service
import { reportService } from '../services';
import { ReportResponse } from '../services/types';

const { width, height } = Dimensions.get('window');

interface ReportItem {
  _id: string;
  user: string;
  location: string;
  lat?: number;
  lon?: number;
  text: string;
  imageUris: string[];
  videoUris: string[];
  dateTime: string;
}

export default function FeedScreen() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeMediaList, setActiveMediaList] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeIsVideo, setActiveIsVideo] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // ---------------- Media/Open Map ----------------
  const openImageViewer = (uris: string[], index = 0) => {
    setActiveMediaList(uris);
    setActiveIndex(index);
    setActiveIsVideo(false);
    setModalVisible(true);
  };

  const openVideoViewer = (uris: string[], index = 0) => {
    setActiveMediaList(uris);
    setActiveIndex(index);
    setActiveIsVideo(true);
    setModalVisible(true);
  };

  const openMap = (lat: number, lon: number) => {
    setMapCoords({ lat, lon });
    setMapVisible(true);
  };

  const getItemLayout = (_data: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  });

  // ---------------- Fetch reports using reportService ----------------
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchReports = async () => {
        setLoading(true);
        try {
          const data = await reportService.getReports();

          if (isActive) {
            const mappedReports: ReportItem[] = data.map((r: ReportResponse) => ({
              _id: r._id,
              user: r.user,
              location: r.location || 'Unknown',
              lat: r.lat,
              lon: r.lon,
              text: r.description,
              imageUris: r.imageUris || [],
              videoUris: r.videoUris || [],
              dateTime: r.createdAt,
            }));

            setReports(mappedReports.reverse());
          }
        } catch (err: any) {
          console.log('Error fetching reports:', err);
          if (err.msg === 'Not logged in') {
            Alert.alert('Not logged in', 'Please login first');
          } else {
            Alert.alert('Error', 'Failed to load reports from server');
          }
        } finally {
          setLoading(false);
        }
      };

      fetchReports();

      return () => { isActive = false; };
    }, [])
  );

  // ---------------- Render ----------------
  return (
    <LinearGradient colors={['#F9FFF9', '#E8F5E9']} style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Entypo name="newsletter" size={28} color="#2E8B57" style={{ marginRight: 8 }} />
        <Text style={styles.title}>Community Feed</Text>
      </View>

      {loading ? (
        <Text style={styles.empty}>Loading reports...</Text>
      ) : reports.length === 0 ? (
        <Text style={styles.empty}>No reports yet. Submit from Report tab.</Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* User + Date */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="account-circle" size={35} color="#2E8B57" style={{ marginRight: 4 }} />
                  <Text style={styles.user}>{item.user}</Text>
                </View>
                <Text style={styles.date}>{new Date(item.dateTime).toLocaleString()}</Text>
              </View>

              {/* Location */}
              {item.lat && item.lon && (
                <TouchableOpacity onPress={() => openMap(item.lat!, item.lon!)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                    <MaterialIcons name="location-on" size={18} color="#4E944F" style={{ marginRight: 4 }} />
                    <Text style={styles.location}>{item.location}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Text */}
              <Text style={styles.text}>{item.text}</Text>

              {/* Images */}
              {item.imageUris.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {item.imageUris.map((uri, i) => (
                    <TouchableOpacity key={`${uri}-${i}`} onPress={() => openImageViewer(item.imageUris, i)}>
                      <Image source={{ uri }} style={styles.thumb} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Videos */}
              {item.videoUris.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {item.videoUris.map((vuri, vi) => (
                    <TouchableOpacity key={`${vuri}-${vi}`} onPress={() => openVideoViewer(item.videoUris, vi)}>
                      <View style={styles.videoPlaceholder}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>▶ Video {vi + 1}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        />
      )}

      {/* Fullscreen Media */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
            <Text style={{ color: '#fff', fontSize: 18 }}>✖ Close</Text>
          </TouchableOpacity>

          {!activeIsVideo ? (
            <FlatList
              horizontal
              pagingEnabled
              data={activeMediaList}
              keyExtractor={(u, i) => `${u}-${i}`}
              getItemLayout={getItemLayout}
              initialScrollIndex={activeIndex}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={{ width, height: height - 80, resizeMode: 'contain' }} />
              )}
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

      {/* Map Modal */}
      <Modal visible={mapVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1 }}>
          {mapCoords && (
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: mapCoords.lat,
                longitude: mapCoords.lon,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker coordinate={{ latitude: mapCoords.lat, longitude: mapCoords.lon }} title="Reported Location" />
            </MapView>
          )}
          <TouchableOpacity style={styles.closeMapBtn} onPress={() => setMapVisible(false)}>
            <Text style={styles.closeMapText}>✖ Close Map</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, marginTop: 40 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2E8B57' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 15, shadowColor: '#2E8B57', shadowOpacity: 0.1, shadowRadius: 6, elevation: 5 },
  user: { fontWeight: 'bold', color: '#2E8B57', fontSize: 15 },
  date: { color: '#777', fontSize: 12 },
  location: { color: '#4E944F', fontSize: 13, textDecorationLine: 'underline' },
  text: { fontSize: 14, color: '#333', marginTop: 8 },
  thumb: { width: 140, height: 120, borderRadius: 12, marginRight: 10, backgroundColor: '#ddd' },
  videoPlaceholder: { width: 140, height: 120, borderRadius: 12, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  modalClose: { position: 'absolute', top: 40, right: 20, zIndex: 10 },
  closeMapBtn: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: '#2E8B57', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 25 },
  closeMapText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  empty: { textAlign: 'center', color: '#777', marginTop: 40 },
});
