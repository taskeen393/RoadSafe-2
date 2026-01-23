// app/Tabs/feed.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';

import { Entypo, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ResizeMode, Video } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';

import { reportService } from '../services';
import { ReportResponse } from '../services/types';
import { getCurrentUser } from '../services/authService';

const { width, height } = Dimensions.get('window');

interface ReportItem {
  _id: string;
  user: string;
  userId?: string;
  location: string;
  lat?: number;
  lon?: number;
  text: string;
  imageUris: string[];
  videoUris: string[];
  dateTime: string;
  title?: string;
}

export default function FeedScreen() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [activeMediaList, setActiveMediaList] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeIsVideo, setActiveIsVideo] = useState(false);

  const [mapVisible, setMapVisible] = useState(false);
  const [mapCoords, setMapCoords] =
    useState<{ lat: number; lon: number } | null>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  /* ---------------- Helpers ---------------- */

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

  const getItemLayout = (_: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  });

  /* ---------------- Fetch Reports ---------------- */

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const fetchReports = async () => {
        setLoading(true);
        try {
          // Get current user
          const user = await getCurrentUser();
          if (user && isMounted) {
            // Handle both _id and id fields (backend might return either)
            const userId = (user._id || (user as any).id) ? String(user._id || (user as any).id) : null;
            const userName = user.name ? String(user.name) : null;
            setCurrentUserId(userId);
            setCurrentUserName(userName);
            if (__DEV__) {
              console.log('Current user:', { id: userId, name: userName, rawUser: user });
            }
          }

          const data = await reportService.getReports();

          if (!isMounted) return;

          const mapped: ReportItem[] = data.map((r: ReportResponse) => {
            const userId = r.userId ? String(r.userId) : undefined;
            if (__DEV__) {
              console.log('Report:', {
                id: r._id,
                userId: userId,
                user: r.user,
                hasUserId: !!r.userId,
              });
            }
            return {
              _id: String(r._id),
              user: String(r.user ?? 'Unknown User'),
              userId: userId,
              location: String(r.location ?? 'Unknown location'),
              lat: typeof r.lat === 'number' ? r.lat : undefined,
              lon: typeof r.lon === 'number' ? r.lon : undefined,
              text: String(r.description ?? ''),
              title: r.title ? String(r.title) : undefined,
              imageUris: Array.isArray(r.imageUris) ? r.imageUris : [],
              videoUris: Array.isArray(r.videoUris) ? r.videoUris : [],
              dateTime: String(r.createdAt ?? new Date().toISOString()),
            };
          });

          setReports(mapped.reverse());
        } catch (err) {
          Alert.alert('Error', 'Failed to load reports');
        } finally {
          setLoading(false);
        }
      };

      fetchReports();
      return () => {
        isMounted = false;
      };
    }, [])
  );

  /* ---------------- Edit/Delete Handlers ---------------- */

  const handleEdit = (report: ReportItem) => {
    setEditingReport(report);
    setEditTitle(report.title || '');
    setEditDescription(report.text);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReport) return;

    try {
      await reportService.updateReport(editingReport._id, {
        title: editTitle,
        description: editDescription,
        location: editingReport.location,
        lat: editingReport.lat || 0,
        lon: editingReport.lon || 0,
        imageUris: editingReport.imageUris,
        videoUris: editingReport.videoUris,
        dateTime: editingReport.dateTime,
        user: editingReport.user,
      });

      // Refresh reports
      const data = await reportService.getReports();
      const mapped: ReportItem[] = data.map((r: ReportResponse) => ({
        _id: String(r._id),
        user: String(r.user ?? 'Unknown User'),
        userId: r.userId ? String(r.userId) : undefined,
        location: String(r.location ?? 'Unknown location'),
        lat: typeof r.lat === 'number' ? r.lat : undefined,
        lon: typeof r.lon === 'number' ? r.lon : undefined,
        text: String(r.description ?? ''),
        title: r.title ? String(r.title) : undefined,
        imageUris: Array.isArray(r.imageUris) ? r.imageUris : [],
        videoUris: Array.isArray(r.videoUris) ? r.videoUris : [],
        dateTime: String(r.createdAt ?? new Date().toISOString()),
      }));

      setReports(mapped.reverse());
      setEditModalVisible(false);
      setEditingReport(null);
      Alert.alert('Success', 'Report updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.msg || 'Failed to update report');
    }
  };

  const handleDelete = (report: ReportItem) => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await reportService.deleteReport(report._id);
              
              // Refresh reports
              const data = await reportService.getReports();
              const mapped: ReportItem[] = data.map((r: ReportResponse) => ({
                _id: String(r._id),
                user: String(r.user ?? 'Unknown User'),
                userId: r.userId ? String(r.userId) : undefined,
                location: String(r.location ?? 'Unknown location'),
                lat: typeof r.lat === 'number' ? r.lat : undefined,
                lon: typeof r.lon === 'number' ? r.lon : undefined,
                text: String(r.description ?? ''),
                title: r.title ? String(r.title) : undefined,
                imageUris: Array.isArray(r.imageUris) ? r.imageUris : [],
                videoUris: Array.isArray(r.videoUris) ? r.videoUris : [],
                dateTime: String(r.createdAt ?? new Date().toISOString()),
              }));

              setReports(mapped.reverse());
              Alert.alert('Success', 'Report deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.msg || 'Failed to delete report');
            }
          },
        },
      ]
    );
  };

  /* ---------------- Render ---------------- */

  return (
    <LinearGradient colors={['#F9FFF9', '#E8F5E9']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Entypo name="newsletter" size={28} color="#2E8B57" />
        <Text style={styles.title}>Community Feed</Text>
      </View>

      {/* Content */}
      {loading ? (
        <Text style={styles.empty}>Loading reports...</Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => {
            const hasLocation = item.lat !== undefined && item.lon !== undefined;

            // Compare userIds - handle both string and ObjectId formats
            // Also fallback to username comparison for old reports without userId
            let isOwner = false;
            
            // Check if currentUserId is valid (not null, not undefined, not "undefined" string)
            const hasValidUserId = currentUserId && 
                                  currentUserId !== 'undefined' && 
                                  currentUserId !== 'null' &&
                                  item.userId;
            
            if (hasValidUserId) {
              // Primary check: userId match
              isOwner = String(currentUserId) === String(item.userId) || 
                       currentUserId.toString() === item.userId.toString();
            } else if (currentUserName && item.user) {
              // Fallback: username match (for old reports without userId or when userId is missing)
              const currentName = String(currentUserName).toLowerCase().trim();
              const itemName = String(item.user).toLowerCase().trim();
              isOwner = currentName === itemName;
              
              if (__DEV__) {
                console.log('Username comparison:', {
                  currentName,
                  itemName,
                  match: currentName === itemName,
                });
              }
            }
            
            if (__DEV__) {
              console.log('Ownership check:', {
                currentUserId,
                currentUserName,
                itemUserId: item.userId,
                itemUser: item.user,
                isOwner,
                itemId: item._id,
              });
            }

            return (
              <View style={styles.card}>
                {/* User Row */}
                <View style={styles.rowBetween}>
                  <View style={styles.row}>
                    <MaterialCommunityIcons
                      name="account-circle"
                      size={36}
                      color="#2E8B57"
                    />
                    <Text style={styles.user}>{item.user}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.date}>
                      {new Date(item.dateTime).toLocaleString()}
                    </Text>
                    {isOwner && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          onPress={() => handleEdit(item)}
                          style={styles.editButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <MaterialIcons name="edit" size={22} color="#2E8B57" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(item)}
                          style={styles.deleteButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <MaterialIcons name="delete" size={22} color="#d32f2f" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>

                {/* Location */}
                {item.location && item.location !== 'Unknown location' && (
                  hasLocation ? (
                    <TouchableOpacity 
                      onPress={() => openMap(item.lat!, item.lon!)}
                      style={{ marginTop: 6 }}
                    >
                      <View style={styles.row}>
                        <MaterialIcons
                          name="location-on"
                          size={18}
                          color="#4E944F"
                        />
                        <Text style={styles.location}>{item.location}</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.row, { marginTop: 6 }]}>
                      <MaterialIcons
                        name="location-on"
                        size={18}
                        color="#4E944F"
                      />
                      <Text style={styles.location}>{item.location}</Text>
                    </View>
                  )
                )}

                {/* Description */}
                {item.text.length > 0 && (
                  <Text style={styles.text}>{item.text}</Text>
                )}

                {/* Images */}
                {item.imageUris.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {item.imageUris.map((uri, i) => (
                      <TouchableOpacity
                        key={`${uri}-${i}`}
                        onPress={() => openImageViewer(item.imageUris, i)}
                      >
                        <Image source={{ uri }} style={styles.thumb} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {/* Videos */}
                {item.videoUris.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {item.videoUris.map((uri, i) => (
                      <TouchableOpacity
                        key={`${uri}-${i}`}
                        onPress={() => openVideoViewer(item.videoUris, i)}
                      >
                        <View style={styles.videoPlaceholder}>
                          <Text style={styles.videoText}>
                            ▶ Video {i + 1}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Media Viewer */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeText}>✖ Close</Text>
          </TouchableOpacity>

          <FlatList
            horizontal
            pagingEnabled
            data={activeMediaList}
            getItemLayout={getItemLayout}
            initialScrollIndex={Math.min(
              activeIndex,
              activeMediaList.length - 1
            )}
            renderItem={({ item }) =>
              activeIsVideo ? (
                <Video
                  source={{ uri: item }}
                  style={{ width, height }}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                />
              ) : (
                <Image
                  source={{ uri: item }}
                  style={{ width, height }}
                  resizeMode="contain"
                />
              )
            }
          />
        </View>
      </Modal>

      {/* Map Modal */}
      <Modal visible={mapVisible} animationType="slide">
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
              <Marker
                coordinate={{
                  latitude: mapCoords.lat,
                  longitude: mapCoords.lon,
                }}
              />
            </MapView>
          )}

          <TouchableOpacity
            style={styles.closeMapBtn}
            onPress={() => setMapVisible(false)}
          >
            <Text style={styles.closeMapText}>✖ Close Map</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>Edit Report</Text>
            
            <Text style={styles.editLabel}>Title</Text>
            <TextInput
              style={styles.editInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Enter title"
            />

            <Text style={styles.editLabel}>Description</Text>
            <TextInput
              style={[styles.editInput, styles.editTextArea]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Enter description"
              multiline
              numberOfLines={4}
            />

            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[styles.editModalButton, styles.cancelButton]}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingReport(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editModalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, marginTop: 40 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2E8B57', marginLeft: 8 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    elevation: 4,
  },

  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  user: { marginLeft: 6, fontWeight: 'bold', color: '#2E8B57' },
  date: { fontSize: 12, color: '#777' },

  location: {
    marginLeft: 4,
    color: '#4E944F',
    textDecorationLine: 'underline',
  },

  text: { marginTop: 8, color: '#333', fontSize: 14 },

  thumb: {
    width: 140,
    height: 120,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#ddd',
  },

  videoPlaceholder: {
    width: 140,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  videoText: { color: '#fff', fontWeight: '700' },

  modalClose: { position: 'absolute', top: 40, right: 20, zIndex: 10 },
  closeText: { color: '#fff', fontSize: 16 },

  closeMapBtn: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#2E8B57',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  closeMapText: { color: '#fff', fontWeight: 'bold' },

  empty: { textAlign: 'center', marginTop: 40, color: '#777' },

  actionButtons: {
    flexDirection: 'row',
    marginLeft: 12,
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    padding: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: 20,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  editModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  editTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  editModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  editModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2E8B57',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
