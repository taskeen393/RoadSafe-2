// app/Tabs/feed.tsx — Community Feed (Light + Dark Green Theme)
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ResizeMode, Video } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { reportService } from '../services';
import { ReportResponse } from '../services/types';
import { getCurrentUser } from '../services/authService';

const { width, height } = Dimensions.get('window');

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

interface ReportItem {
  _id: string;
  user: string;
  userId?: string;
  userProfileImage?: string;
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
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  // Viewer States
  const [modalVisible, setModalVisible] = useState(false);
  const [activeMediaList, setActiveMediaList] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeIsVideo, setActiveIsVideo] = useState(false);

  // Map State
  const [mapVisible, setMapVisible] = useState(false);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Edit State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  /* ---------------- Fetching ---------------- */
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const fetchData = async () => {
        setLoading(true);
        try {
          const user = await getCurrentUser();
          if (user && isMounted) {
            setCurrentUserId((user._id || (user as any).id) ? String(user._id || (user as any).id) : null);
            setCurrentUserName(user.name ? String(user.name) : null);
          }
          const data = await reportService.getReports();
          if (!isMounted) return;

          const mapped: ReportItem[] = data.map((r: ReportResponse) => ({
            _id: String(r._id),
            user: String(r.user ?? 'Unknown User'),
            userId: r.userId ? String(r.userId) : undefined,
            userProfileImage: r.userProfileImage ? String(r.userProfileImage) : undefined,
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
        } catch (err) {
          // Silent error or toast could go here
        } finally {
          setLoading(false);
        }
      };
      fetchData();
      return () => { isMounted = false; };
    }, [])
  );

  /* ---------------- Actions ---------------- */
  const openMedia = (uris: string[], index = 0, isVideo = false) => {
    setActiveMediaList(uris); setActiveIndex(index); setActiveIsVideo(isVideo); setModalVisible(true);
  };

  const openMap = (lat: number, lon: number) => {
    setMapCoords({ lat, lon }); setMapVisible(true);
  };

  const handleEdit = (report: ReportItem) => {
    setEditingReport(report);
    setEditTitle(report.title || '');
    setEditDescription(report.text);
    setEditModalVisible(true);
  };

  const confirmDelete = (report: ReportItem) => {
    Alert.alert('Delete Post', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await reportService.deleteReport(report._id);
            setReports(prev => prev.filter(r => r._id !== report._id));
          } catch { Alert.alert('Error', 'Could not delete post'); }
        }
      }
    ]);
  };

  const saveEdit = async () => {
    if (!editingReport) return;
    try {
      await reportService.updateReport(editingReport._id, {
        ...editingReport,
        title: editTitle,
        description: editDescription,
      } as any);
      setReports(prev => prev.map(r => r._id === editingReport._id ? { ...r, title: editTitle, text: editDescription } : r));
      setEditModalVisible(false);
    } catch { Alert.alert('Error', 'Update failed'); }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const isOwner = (item: ReportItem) => {
    if (currentUserId && item.userId) return String(currentUserId) === String(item.userId);
    return currentUserName?.toLowerCase() === item.user.toLowerCase();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ─── Hero ─── */}
      <LinearGradient colors={[G.darkGreen, G.midGreen]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={styles.heroDeco} />
        <View style={styles.heroDeco2} />
        <View style={styles.heroRow}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="people" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Community</Text>
            <Text style={styles.heroSub}>Updates from nearby travelers</Text>
          </View>
          {reports.length > 0 && (
            <View style={styles.statsBadge}>
              <Text style={styles.statsNum}>{reports.length}</Text>
              <Text style={styles.statsLabel}>Reports</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* ─── Feed ─── */}
      <FlatList
        data={reports}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => { /* re-trigger fetch */ }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <MaterialCommunityIcons name="newspaper-variant-outline" size={40} color={G.midGreen} />
              </View>
              <Text style={styles.emptyTitle}>No reports yet</Text>
              <Text style={styles.emptyText}>Be the first to share a road update with the community</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const hasLoc = item.lat !== undefined && item.lon !== undefined;
          const owner = isOwner(item);
          const totalMedia = item.imageUris.length + item.videoUris.length;

          return (
            <View style={styles.card}>
              {/* Top accent line */}
              <LinearGradient
                colors={[G.darkGreen, G.midGreen]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardAccent}
              />

              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.avatarWrap}>
                  {item.userProfileImage ? (
                    <Image source={{ uri: item.userProfileImage }} style={styles.avatar} />
                  ) : (
                    <LinearGradient colors={[G.midGreen, G.darkGreen]} style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>{item.user.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.onlineDot} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName} numberOfLines={1}>{item.user}</Text>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={11} color={G.sub} />
                    <Text style={styles.timeText}>{timeAgo(item.dateTime)}</Text>
                  </View>
                </View>
                {owner && (
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionIcon}>
                      <Ionicons name="create-outline" size={16} color={G.midGreen} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(item)} style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons name="trash-outline" size={16} color={G.red} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Content */}
              <View style={styles.cardBody}>
                {!!item.title && <Text style={styles.cardTitle}>{item.title}</Text>}
                <Text style={styles.cardText}>{item.text}</Text>

                {/* Location Badge */}
                {!!item.location && item.location !== 'Unknown location' && (
                  <TouchableOpacity
                    style={styles.locBadge}
                    disabled={!hasLoc}
                    onPress={() => hasLoc && openMap(item.lat!, item.lon!)}
                  >
                    <View style={styles.locIconWrap}>
                      <Ionicons name="location-sharp" size={12} color={G.midGreen} />
                    </View>
                    <Text style={styles.locText} numberOfLines={1}>{item.location}</Text>
                    {hasLoc && <Ionicons name="chevron-forward" size={12} color={G.midGreen} />}
                  </TouchableOpacity>
                )}

                {/* Media Gallery */}
                {(item.imageUris.length > 0 || item.videoUris.length > 0) && (
                  <View style={styles.mediaSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                      {item.imageUris.map((uri, i) => (
                        <TouchableOpacity key={i} onPress={() => openMedia(item.imageUris, i)} activeOpacity={0.9}>
                          <Image source={{ uri }} style={styles.mediaThumb} />
                          {i === 0 && totalMedia > 1 && (
                            <View style={styles.mediaBadge}>
                              <Ionicons name="images" size={10} color="#fff" />
                              <Text style={styles.mediaBadgeText}>{totalMedia}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                      {item.videoUris.map((uri, i) => (
                        <TouchableOpacity key={i} onPress={() => openMedia(item.videoUris, i, true)} activeOpacity={0.9}>
                          <View style={styles.videoThumb}>
                            <View style={styles.playBtnBg}>
                              <Ionicons name="play" size={20} color="#fff" />
                            </View>
                            <Text style={styles.videoLabel}>Video</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* ─── Media Modal ─── */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <FlatList
            horizontal pagingEnabled
            data={activeMediaList}
            keyExtractor={(_, i) => String(i)}
            initialScrollIndex={activeIndex}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            renderItem={({ item }) => (
              <View style={{ width, height, justifyContent: 'center' }}>
                {activeIsVideo ? (
                  <Video source={{ uri: item }} style={{ width, height: 300 }} useNativeControls resizeMode={ResizeMode.CONTAIN} shouldPlay />
                ) : (
                  <Image source={{ uri: item }} style={{ width, height: '100%' }} resizeMode="contain" />
                )}
              </View>
            )}
          />
        </View>
      </Modal>

      {/* ─── Map Modal ─── */}
      <Modal visible={mapVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{ latitude: mapCoords?.lat || 24.8, longitude: mapCoords?.lon || 67.0, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          >
            {mapCoords && <Marker coordinate={{ latitude: mapCoords.lat, longitude: mapCoords.lon }} />}
          </MapView>
          <TouchableOpacity style={styles.closeMapBtn} onPress={() => setMapVisible(false)}>
            <Text style={styles.closeMapText}>Close Map</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ─── Edit Modal ─── */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.editOverlay}>
          <View style={styles.editCard}>
            <View style={styles.editHeaderRow}>
              <View style={styles.editIconWrap}>
                <Ionicons name="create" size={18} color={G.midGreen} />
              </View>
              <Text style={styles.editHeader}>Edit Post</Text>
            </View>
            <TextInput style={styles.editInput} value={editTitle} onChangeText={setEditTitle} placeholder="Title" placeholderTextColor={G.sub} />
            <TextInput style={[styles.editInput, { height: 110 }]} value={editDescription} onChangeText={setEditDescription} placeholder="Description" placeholderTextColor={G.sub} multiline textAlignVertical="top" />
            <View style={styles.editBtns}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={[styles.editBtn, { backgroundColor: '#F3F4F6' }]}>
                <Ionicons name="close-outline" size={16} color={G.sub} />
                <Text style={{ color: G.sub, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={[styles.editBtn, { backgroundColor: G.darkGreen }]}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: G.bg },

  // Hero
  hero: { paddingHorizontal: 20, paddingBottom: 22, overflow: 'hidden' },
  heroDeco: { position: 'absolute', top: -40, right: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.06)' },
  heroDeco2: { position: 'absolute', bottom: -50, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.04)' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  statsBadge: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  statsNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statsLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 1 },

  // Card
  card: {
    backgroundColor: G.card,
    borderRadius: 20,
    marginBottom: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#1A4D2E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14 },
      android: { elevation: 4 },
    }),
  },
  cardAccent: { height: 3, width: '100%' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: G.midGreen },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 17, fontWeight: '800', color: '#fff' },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 15, fontWeight: '700', color: G.text, letterSpacing: -0.2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  timeText: { fontSize: 12, color: G.sub },
  actions: { flexDirection: 'row', gap: 8 },
  actionIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: G.lightGreen, justifyContent: 'center', alignItems: 'center' },

  // Body
  cardBody: { paddingHorizontal: 16, paddingBottom: 18 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: G.text, marginBottom: 6, letterSpacing: -0.2 },
  cardText: { fontSize: 14, lineHeight: 22, color: '#374151', marginBottom: 12 },
  locBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: G.lightGreen, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, gap: 6, marginBottom: 12, borderWidth: 1, borderColor: G.border },
  locIconWrap: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(45,122,77,0.12)', justifyContent: 'center', alignItems: 'center' },
  locText: { fontSize: 12, color: G.midGreen, fontWeight: '600', maxWidth: width * 0.55 },

  // Media
  mediaSection: { marginTop: 4 },
  mediaThumb: { width: 150, height: 190, borderRadius: 14, backgroundColor: '#eee' },
  videoThumb: { width: 150, height: 190, borderRadius: 14, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', gap: 6 },
  playBtnBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  videoLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  mediaBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  mediaBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Empty
  empty: { alignItems: 'center', marginTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: G.lightGreen, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: G.text },
  emptyText: { color: G.sub, fontSize: 14, textAlign: 'center', lineHeight: 21 },

  // Viewer
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 },
  closeMapBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: G.darkGreen, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  closeMapText: { color: '#fff', fontWeight: '700' },

  // Edit Modal
  editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  editCard: { backgroundColor: '#fff', borderRadius: 22, padding: 22 },
  editHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  editIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: G.lightGreen, justifyContent: 'center', alignItems: 'center' },
  editHeader: { fontSize: 18, fontWeight: '700', color: G.text },
  editInput: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, padding: 14, marginBottom: 12, fontSize: 15, color: G.text },
  editBtns: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 11, paddingHorizontal: 20, borderRadius: 12 },
});
