// app/Tabs/feed.tsx — Community Feed (Light + Dark Green Theme)
import { Entypo, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
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
        <View style={styles.heroRow}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="people" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Community</Text>
            <Text style={styles.heroSub}>Updates from nearby travelers</Text>
          </View>
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
              <Ionicons name="newspaper-outline" size={48} color={G.border} />
              <Text style={styles.emptyText}>No reports yet</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const hasLoc = item.lat !== undefined && item.lon !== undefined;
          const owner = isOwner(item);

          return (
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.avatarWrap}>
                  {item.userProfileImage ? (
                    <Image source={{ uri: item.userProfileImage }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>{item.user.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName} numberOfLines={1}>{item.user}</Text>
                  <Text style={styles.timeText}>{timeAgo(item.dateTime)}</Text>
                </View>
                {owner && (
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionIcon}>
                      <Ionicons name="create-outline" size={18} color={G.midGreen} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(item)} style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons name="trash-outline" size={18} color={G.red} />
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
                    <Ionicons name="location-sharp" size={14} color={G.midGreen} />
                    <Text style={styles.locText} numberOfLines={1}>{item.location}</Text>
                    {hasLoc && <Ionicons name="chevron-forward" size={12} color={G.midGreen} />}
                  </TouchableOpacity>
                )}

                {/* Media Gallery */}
                {(item.imageUris.length > 0 || item.videoUris.length > 0) && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 12 }}>
                    {item.imageUris.map((uri, i) => (
                      <TouchableOpacity key={i} onPress={() => openMedia(item.imageUris, i)} activeOpacity={0.9}>
                        <Image source={{ uri }} style={styles.mediaThumb} />
                      </TouchableOpacity>
                    ))}
                    {item.videoUris.map((uri, i) => (
                      <TouchableOpacity key={i} onPress={() => openMedia(item.videoUris, i, true)} activeOpacity={0.9}>
                        <View style={styles.videoThumb}>
                          <Ionicons name="play" size={24} color="#fff" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Footer / Interaction */}
              <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.interactBtn}>
                  <Ionicons name="heart-outline" size={20} color={G.sub} />
                  <Text style={styles.interactText}>Like</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.interactBtn}>
                  <Ionicons name="chatbubble-outline" size={19} color={G.sub} />
                  <Text style={styles.interactText}>Comment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.interactBtn}>
                  <Ionicons name="share-social-outline" size={20} color={G.sub} />
                  <Text style={styles.interactText}>Share</Text>
                </TouchableOpacity>
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
            <Text style={styles.editHeader}>Edit Post</Text>
            <TextInput style={styles.editInput} value={editTitle} onChangeText={setEditTitle} placeholder="Title" placeholderTextColor={G.sub} />
            <TextInput style={[styles.editInput, { height: 100 }]} value={editDescription} onChangeText={setEditDescription} placeholder="Description" placeholderTextColor={G.sub} multiline textAlignVertical="top" />
            <View style={styles.editBtns}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={[styles.editBtn, { backgroundColor: '#F3F4F6' }]}>
                <Text style={{ color: G.sub }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={[styles.editBtn, { backgroundColor: G.darkGreen }]}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
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
  hero: { paddingHorizontal: 20, paddingBottom: 22 },
  heroDeco: { position: 'absolute', top: -40, right: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.06)' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  // Card
  card: { backgroundColor: G.card, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: G.border, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10 }, android: { elevation: 3 } }) },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: G.midGreen },
  avatarPlaceholder: { width: 42, height: 42, borderRadius: 21, backgroundColor: G.lightGreen, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: G.midGreen },
  avatarInitials: { fontSize: 16, fontWeight: '700', color: G.midGreen },
  userName: { fontSize: 15, fontWeight: '700', color: G.text },
  timeText: { fontSize: 12, color: G.sub },
  actions: { flexDirection: 'row', gap: 6 },
  actionIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: G.lightGreen, justifyContent: 'center', alignItems: 'center' },

  // Body
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: G.text, marginBottom: 4 },
  cardText: { fontSize: 14, lineHeight: 21, color: '#374151', marginBottom: 10 },
  locBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#F0FDF4', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, gap: 4, marginBottom: 10 },
  locText: { fontSize: 12, color: G.midGreen, fontWeight: '600' },

  // Media
  mediaThumb: { width: 140, height: 180, borderRadius: 12, backgroundColor: '#eee' },
  videoThumb: { width: 140, height: 180, borderRadius: 12, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },

  // Footer
  cardFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingVertical: 10 },
  interactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  interactText: { fontSize: 13, color: G.sub, fontWeight: '600' },

  // Empty
  empty: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyText: { color: G.sub, fontSize: 16 },

  // Viewer
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 },
  closeMapBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: G.darkGreen, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  closeMapText: { color: '#fff', fontWeight: '700' },

  // Edit Modal
  editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  editCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  editHeader: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: G.text },
  editInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 15 },
  editBtns: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  editBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
});
