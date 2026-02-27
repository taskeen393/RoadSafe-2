// app/Tabs/feed.tsx — Community Feed (Light + Dark Theme)
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ResizeMode, Video } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { reportService } from '../services';
import { getCurrentUser } from '../services/authService';
import { useToast } from '../../components/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

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
  const { colors: G, isDark } = useTheme();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalReports, setTotalReports] = useState(0);
  const isLoadingRef = useRef(false);

  const PAGE_SIZE = 10;

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

  // Delete Confirm State
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deletingReport, setDeletingReport] = useState<ReportItem | null>(null);

  const { showToast } = useToast();

  const mapReportData = (data: any[]): ReportItem[] =>
    data.map((r: any) => ({
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

  /* ----- Initial fetch (page 1) ----- */
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const fetchInitial = async () => {
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;
        setLoading(true);
        try {
          const user = await getCurrentUser();
          if (user && isMounted) {
            setCurrentUserId((user._id || (user as any).id) ? String(user._id || (user as any).id) : null);
            setCurrentUserName(user.name ? String(user.name) : null);
          }
          const res = await reportService.getReportsPaginated(1, PAGE_SIZE);
          if (!isMounted) return;
          setReports(mapReportData(res.reports));
          setPage(1);
          setHasMore(res.hasMore);
          setTotalReports(res.total);
        } catch (err) {
          // silent
        } finally {
          setLoading(false);
          isLoadingRef.current = false;
        }
      };
      fetchInitial();
      return () => { isMounted = false; };
    }, [])
  );

  /* ----- Load more (next page) ----- */
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingRef.current || loadingMore) return;
    isLoadingRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await reportService.getReportsPaginated(nextPage, PAGE_SIZE);
      const newItems = mapReportData(res.reports);
      setReports(prev => [...prev, ...newItems]);
      setPage(nextPage);
      setHasMore(res.hasMore);
      setTotalReports(res.total);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [hasMore, loadingMore, page]);

  /* ----- Pull-to-refresh ----- */
  const handleRefresh = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    try {
      const res = await reportService.getReportsPaginated(1, PAGE_SIZE);
      setReports(mapReportData(res.reports));
      setPage(1);
      setHasMore(res.hasMore);
      setTotalReports(res.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

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
    setDeletingReport(report);
    setDeleteDialogVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingReport) return;
    setDeleteDialogVisible(false);
    try {
      await reportService.deleteReport(deletingReport._id);
      setReports(prev => prev.filter(r => r._id !== deletingReport._id));
      showToast({ type: 'success', title: 'Deleted', message: 'Post has been removed' });
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Could not delete post' });
    }
    setDeletingReport(null);
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
      showToast({ type: 'success', title: 'Updated', message: 'Post has been updated' });
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Update failed' });
    }
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
    <View style={[styles.root, { backgroundColor: G.bg, paddingTop: insets.top }]}>
      {/* ─── Hero ─── */}
      <LinearGradient colors={G.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 12 }]}>
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
              <Text style={styles.statsNum}>{totalReports || reports.length}</Text>
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
        onRefresh={handleRefresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={G.midGreen} />
              <Text style={[styles.loadingMoreText, { color: G.sub }]}>Loading more reports...</Text>
            </View>
          ) : !hasMore && reports.length > 0 ? (
            <View style={styles.loadingMore}>
              <Text style={[styles.loadingMoreText, { color: G.sub }]}>No more reports</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: G.lightGreen }]}>
                <MaterialCommunityIcons name="newspaper-variant-outline" size={40} color={G.midGreen} />
              </View>
              <Text style={[styles.emptyTitle, { color: G.text }]}>No reports yet</Text>
              <Text style={[styles.emptyText, { color: G.sub }]}>Be the first to share a road update with the community</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const hasLoc = item.lat !== undefined && item.lon !== undefined;
          const owner = isOwner(item);
          const imgCount = item.imageUris.length;
          const vidCount = item.videoUris.length;
          const totalMedia = imgCount + vidCount;
          const hasMedia = totalMedia > 0;

          return (
            <View style={[styles.card, {
              backgroundColor: G.card,
              borderColor: isDark ? G.border : 'rgba(0,0,0,0.04)',
              ...Platform.select({
                ios: { shadowColor: isDark ? '#000' : '#1A4D2E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.3 : 0.06, shadowRadius: 16 },
                android: { elevation: 3 },
              }),
            }]}>
              {/* ─── Header ─── */}
              <View style={styles.cardHeader}>
                <View style={styles.avatarWrap}>
                  {item.userProfileImage ? (
                    <Image source={{ uri: item.userProfileImage }} style={[styles.avatar, { borderColor: G.lightGreen }]} />
                  ) : (
                    <LinearGradient colors={[G.midGreen, G.darkGreen]} style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>{item.user.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: G.text }]} numberOfLines={1}>{item.user}</Text>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={11} color={G.sub} />
                    <Text style={[styles.timeText, { color: G.sub }]}>{timeAgo(item.dateTime)}</Text>
                    {!!item.location && item.location !== 'Unknown location' && (
                      <>
                        <Text style={[styles.timeDot, { color: G.sub }]}>·</Text>
                        <Ionicons name="location" size={11} color={G.sub} />
                        <Text style={[styles.timeText, { color: G.sub }]} numberOfLines={1}>{item.location.split(',')[0]}</Text>
                      </>
                    )}
                  </View>
                </View>
                {owner && (
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.actionIcon, { backgroundColor: G.lightGreen }]}>
                      <Ionicons name="create-outline" size={16} color={G.midGreen} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(item)} style={[styles.actionIcon, { backgroundColor: isDark ? '#3A2020' : '#FEE2E2' }]}>
                      <Ionicons name="trash-outline" size={16} color={G.red} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* ─── Text Content ─── */}
              <View style={styles.cardBody}>
                {!!item.title && <Text style={[styles.cardTitle, { color: G.text }]}>{item.title}</Text>}
                {!!item.text && item.text !== 'No description' && (
                  <Text style={[styles.cardText, { color: isDark ? G.sub : '#4B5563' }]} numberOfLines={hasMedia ? 3 : 8}>{item.text}</Text>
                )}
              </View>

              {/* ─── Media Section ─── */}
              {hasMedia && (
                <View style={styles.mediaSection}>
                  {/* Single full-width image */}
                  {imgCount === 1 && vidCount === 0 && (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => openMedia(item.imageUris, 0)}>
                      <Image source={{ uri: item.imageUris[0] }} style={[styles.mediaHero, { backgroundColor: G.chipBg }]} />
                    </TouchableOpacity>
                  )}

                  {/* Two images side by side */}
                  {imgCount === 2 && vidCount === 0 && (
                    <View style={styles.mediaGrid2}>
                      {item.imageUris.map((uri, i) => (
                        <TouchableOpacity key={i} activeOpacity={0.9} onPress={() => openMedia(item.imageUris, i)} style={{ flex: 1 }}>
                          <Image source={{ uri }} style={[styles.mediaGrid2Img, { backgroundColor: G.chipBg }]} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* 3+ images: hero + grid */}
                  {imgCount >= 3 && vidCount === 0 && (
                    <View>
                      <TouchableOpacity activeOpacity={0.9} onPress={() => openMedia(item.imageUris, 0)}>
                        <Image source={{ uri: item.imageUris[0] }} style={[styles.mediaHero, { backgroundColor: G.chipBg }]} />
                      </TouchableOpacity>
                      <View style={styles.mediaGrid2}>
                        <TouchableOpacity activeOpacity={0.9} onPress={() => openMedia(item.imageUris, 1)} style={{ flex: 1 }}>
                          <Image source={{ uri: item.imageUris[1] }} style={[styles.mediaGridSmall, { backgroundColor: G.chipBg }]} />
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.9} onPress={() => openMedia(item.imageUris, 2)} style={{ flex: 1 }}>
                          <Image source={{ uri: item.imageUris[2] }} style={[styles.mediaGridSmall, { backgroundColor: G.chipBg }]} />
                          {imgCount > 3 && (
                            <View style={styles.mediaOverlay}>
                              <Text style={styles.mediaOverlayText}>+{imgCount - 3}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Videos */}
                  {vidCount > 0 && imgCount === 0 && (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => openMedia(item.videoUris, 0, true)}>
                      <View style={[styles.videoHero, { backgroundColor: isDark ? '#1A1A1A' : '#111827' }]}>
                        <View style={styles.videoPlayCircle}>
                          <Ionicons name="play" size={28} color="#fff" />
                        </View>
                        <View style={styles.videoBadge}>
                          <Ionicons name="videocam" size={12} color="#fff" />
                          <Text style={styles.videoBadgeText}>{vidCount > 1 ? `${vidCount} videos` : 'Video'}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Mixed: images + videos */}
                  {imgCount > 0 && vidCount > 0 && (
                    <View>
                      <TouchableOpacity activeOpacity={0.9} onPress={() => openMedia(item.imageUris, 0)}>
                        <Image source={{ uri: item.imageUris[0] }} style={[styles.mediaHero, { backgroundColor: G.chipBg }]} />
                        {imgCount > 1 && (
                          <View style={styles.mediaBadge}>
                            <Ionicons name="images" size={11} color="#fff" />
                            <Text style={styles.mediaBadgeText}>{imgCount}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity activeOpacity={0.9} onPress={() => openMedia(item.videoUris, 0, true)}>
                        <View style={styles.videoStrip}>
                          <View style={[styles.videoStripPlayBtn, { backgroundColor: G.midGreen }]}>
                            <Ionicons name="play" size={16} color="#fff" />
                          </View>
                          <Text style={styles.videoStripText}>{vidCount} video{vidCount > 1 ? 's' : ''}</Text>
                          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* ─── Footer ─── */}
              <View style={[styles.cardFooter, { borderTopColor: isDark ? G.border : 'rgba(0,0,0,0.04)' }]}>
                {!!item.location && item.location !== 'Unknown location' && (
                  <TouchableOpacity
                    style={[styles.footerChip, { flex: 1 }]}
                    disabled={!hasLoc}
                    onPress={() => hasLoc && openMap(item.lat!, item.lon!)}
                  >
                    <Ionicons name="location" size={14} color={hasLoc ? G.midGreen : G.sub} />
                    <Text style={[styles.footerChipText, { color: G.text }, !hasLoc && { color: G.sub }]}>
                      {item.location}
                    </Text>
                  </TouchableOpacity>
                )}
                {hasMedia && (
                  <View style={[styles.footerMediaBadge, { backgroundColor: G.chipBg }]}>
                    <Ionicons name={imgCount > 0 ? 'images-outline' : 'videocam-outline'} size={13} color={G.sub} />
                    <Text style={[styles.footerChipText, { color: G.sub }]}>{totalMedia} media</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* ─── Media Modal ─── */}
      <Modal visible={modalVisible} animationType="slide" transparent={false} onRequestClose={() => setModalVisible(false)}>
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
      <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{ latitude: mapCoords?.lat || 24.8, longitude: mapCoords?.lon || 67.0, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          >
            {mapCoords && <Marker coordinate={{ latitude: mapCoords.lat, longitude: mapCoords.lon }} />}
          </MapView>
          <TouchableOpacity style={[styles.closeMapBtn, { backgroundColor: G.darkGreen }]} onPress={() => setMapVisible(false)}>
            <Text style={styles.closeMapText}>Close Map</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ─── Edit Modal ─── */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={[styles.editOverlay, { backgroundColor: G.overlay }]}>
          <View style={[styles.editCard, { backgroundColor: G.modalBg }]}>
            <View style={styles.editHeaderRow}>
              <View style={[styles.editIconWrap, { backgroundColor: G.lightGreen }]}>
                <Ionicons name="create" size={18} color={G.midGreen} />
              </View>
              <Text style={[styles.editHeader, { color: G.text }]}>Edit Post</Text>
            </View>
            <TextInput style={[styles.editInput, { backgroundColor: G.inputBg, borderColor: G.border, color: G.text }]} value={editTitle} onChangeText={setEditTitle} placeholder="Title" placeholderTextColor={G.sub} />
            <TextInput style={[styles.editInput, { height: 110, backgroundColor: G.inputBg, borderColor: G.border, color: G.text }]} value={editDescription} onChangeText={setEditDescription} placeholder="Description" placeholderTextColor={G.sub} multiline textAlignVertical="top" />
            <View style={styles.editBtns}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={[styles.editBtn, { backgroundColor: G.chipBg }]}>
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

      {/* ─── Delete Confirm Dialog ─── */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteDialogVisible(false); setDeletingReport(null); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

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
    borderRadius: 22,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, gap: 12 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2 },
  avatarPlaceholder: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 16, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, flexShrink: 1 },
  timeText: { fontSize: 12 },
  timeDot: { fontSize: 12, marginHorizontal: 1 },
  actions: { flexDirection: 'row', gap: 6 },
  actionIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  // Body
  cardBody: { paddingHorizontal: 16, paddingBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, letterSpacing: -0.3, lineHeight: 22 },
  cardText: { fontSize: 14, lineHeight: 21, marginBottom: 8 },

  // Media
  mediaSection: { marginTop: 2 },
  mediaHero: { width: '100%' as any, height: 220 },
  mediaGrid2: { flexDirection: 'row', gap: 2, marginTop: 2 },
  mediaGrid2Img: { width: '100%' as any, height: 140 },
  mediaGridSmall: { width: '100%' as any, height: 110 },
  mediaOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  mediaOverlayText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  mediaBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.55)', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  mediaBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Video
  videoHero: { width: '100%' as any, height: 180, justifyContent: 'center', alignItems: 'center' },
  videoPlayCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(45,122,77,0.85)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  videoBadge: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  videoBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  videoStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1F2937', paddingHorizontal: 16, paddingVertical: 12 },
  videoStripPlayBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  videoStripText: { flex: 1, fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },

  // Footer
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, borderTopWidth: 1, marginTop: 4 },
  footerChip: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  footerChipText: { fontSize: 13, lineHeight: 18, flexShrink: 1 },
  footerMediaBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, alignSelf: 'flex-start' },

  // Empty
  empty: { alignItems: 'center', marginTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 21 },

  // Viewer
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 },
  closeMapBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  closeMapText: { color: '#fff', fontWeight: '700' },

  // Edit Modal
  editOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  editCard: { borderRadius: 22, padding: 22 },
  editHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  editIconWrap: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  editHeader: { fontSize: 18, fontWeight: '700' },
  editInput: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 12, fontSize: 15 },
  editBtns: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 11, paddingHorizontal: 20, borderRadius: 12 },

  // Loading more
  loadingMore: { alignItems: 'center', paddingVertical: 20, gap: 8, flexDirection: 'row', justifyContent: 'center' },
  loadingMoreText: { fontSize: 13, fontWeight: '500' },
});
