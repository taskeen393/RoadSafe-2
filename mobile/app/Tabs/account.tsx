import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { userService } from "../services";
import { useToast } from "../../components/ToastContext";
import ConfirmDialog from "../../components/ConfirmDialog";

const { width } = Dimensions.get("window");

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();
  const { colors: G, isDark, toggleTheme } = useTheme();

  const [image, setImage] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Edit Profile State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const { showToast } = useToast();

  const isValidImage = (url: string | undefined | null): boolean => {
    return !!url && url !== 'null' && url !== 'undefined' && url.startsWith('http');
  };

  // Refresh user data on screen focus
  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [])
  );

  // Load profile image from user object or SecureStore (fallback)
  useEffect(() => {
    setImageError(false);
    (async () => {
      if (isValidImage(user?.profileImage)) {
        setImage(user!.profileImage!);
      } else if (isValidImage((user as any)?.profileImage)) {
        setImage((user as any).profileImage);
      } else {
        const saved = await SecureStore.getItemAsync("profileImage");
        if (saved && isValidImage(saved)) {
          setImage(saved);
        } else {
          setImage(null);
        }
      }
    })();
  }, [user]);

  // ─── Image Handlers ───
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast({ type: 'warning', title: 'Permission Required', message: 'Please allow access to your photos' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setEditingImage(result.assets[0].uri);
    }
  };

  const rotateImage = async () => {
    if (!editingImage) return;
    const result = await ImageManipulator.manipulateAsync(
      editingImage, [{ rotate: 90 }],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );
    setEditingImage(result.uri);
  };

  const flipImage = async () => {
    if (!editingImage) return;
    const result = await ImageManipulator.manipulateAsync(
      editingImage, [{ flip: ImageManipulator.FlipType.Horizontal }],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );
    setEditingImage(result.uri);
  };

  const saveImage = async () => {
    if (!editingImage) return;
    setIsUploading(true);
    try {
      const result = await userService.updateProfile({
        profileImageUri: editingImage,
      });
      if (result.user?.profileImage) {
        setImage(result.user.profileImage);
        await SecureStore.setItemAsync("profileImage", result.user.profileImage);
        await refreshUser();
      }
      setEditingImage(null);
      showToast({ type: 'success', title: 'Success', message: 'Profile picture updated!' });
    } catch (error: any) {
      showToast({ type: 'error', title: 'Upload Failed', message: error.msg || 'Failed to update profile picture' });
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Edit Profile Handlers ───
  const openEditProfile = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditModalVisible(true);
  };

  const saveProfile = async () => {
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();

    if (!trimmedName) {
      return showToast({ type: 'warning', title: 'Required', message: 'Please enter your name' });
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return showToast({ type: 'warning', title: 'Required', message: 'Please enter a valid email' });
    }

    // If nothing changed, just close
    if (trimmedName === user?.name && trimmedEmail === user?.email) {
      setEditModalVisible(false);
      return;
    }

    setIsSavingProfile(true);
    try {
      await userService.updateProfile({
        name: trimmedName,
        email: trimmedEmail,
      });
      await refreshUser();
      setEditModalVisible(false);
      showToast({ type: 'success', title: 'Updated!', message: 'Your profile has been updated' });
    } catch (error: any) {
      showToast({ type: 'error', title: 'Error', message: error.msg || 'Failed to update profile' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ─── Logout ───
  const handleLogout = async () => {
    setLogoutDialogVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutDialogVisible(false);
    try {
      await logout();
      router.replace("/auth/login");
    } catch {
      router.replace("/auth/login");
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'User';
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <View style={[styles.root, { backgroundColor: G.bg, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ─── Hero Profile Header ─── */}
        <LinearGradient
          colors={G.gradientHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.heroDeco1} />
          <View style={styles.heroDeco2} />

          {/* Back Button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
              <View style={styles.avatarContainer}>
                {image && !imageError ? (
                  <Image
                    source={{ uri: image }}
                    style={styles.avatar}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <LinearGradient colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']} style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </LinearGradient>
                )}
                <View style={[styles.cameraBadge, { backgroundColor: G.midGreen }]}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>

            <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@email.com'}</Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="document-text-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statLabel}>Member</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="shield-checkmark-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statLabel}>Verified</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statLabel}>Active</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ─── Image Editor ─── */}
        {editingImage && (
          <View style={[styles.editorSection, {
            backgroundColor: G.card,
            ...Platform.select({
              ios: { shadowColor: isDark ? '#000' : G.darkGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.3 : 0.1, shadowRadius: 14 },
              android: { elevation: 5 },
            }),
          }]}>
            <Text style={[styles.editorTitle, { color: G.text }]}>Edit Photo</Text>
            <Image source={{ uri: editingImage }} style={styles.preview} />
            <View style={styles.editorRow}>
              <TouchableOpacity style={[styles.editorBtn, { backgroundColor: G.inputBg, borderColor: G.border }]} onPress={rotateImage}>
                <View style={[styles.editorBtnIcon, { backgroundColor: G.lightGreen }]}>
                  <Ionicons name="refresh" size={18} color={G.midGreen} />
                </View>
                <Text style={[styles.editorBtnText, { color: G.text }]}>Rotate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editorBtn, { backgroundColor: G.inputBg, borderColor: G.border }]} onPress={flipImage}>
                <View style={[styles.editorBtnIcon, { backgroundColor: isDark ? '#2A2A4A' : '#EEF2FF' }]}>
                  <Ionicons name="swap-horizontal" size={18} color="#6366F1" />
                </View>
                <Text style={[styles.editorBtnText, { color: G.text }]}>Flip</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.editorActions}>
              <TouchableOpacity style={[styles.cancelEditBtn, { backgroundColor: G.chipBg }]} onPress={() => setEditingImage(null)}>
                <Text style={[styles.cancelEditText, { color: G.sub }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveEditBtn, isUploading && { opacity: 0.6 }]}
                onPress={saveImage}
                disabled={isUploading}
              >
                <LinearGradient colors={[G.darkGreen, G.midGreen] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveEditGrad}>
                  <Ionicons name={isUploading ? "cloud-upload" : "checkmark"} size={18} color="#fff" />
                  <Text style={styles.saveEditText}>{isUploading ? 'Uploading...' : 'Save Photo'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Body ─── */}
        <View style={styles.body}>

          {/* Info Card */}
          <View style={[styles.infoCard, {
            backgroundColor: G.card,
            ...Platform.select({
              ios: { shadowColor: isDark ? '#000' : G.darkGreen, shadowOffset: { width: 0, height: 3 }, shadowOpacity: isDark ? 0.3 : 0.08, shadowRadius: 12 },
              android: { elevation: 3 },
            }),
          }]}>
            <View style={styles.infoCardHeader}>
              <View style={[styles.infoIconWrap, { backgroundColor: G.lightGreen }]}>
                <Ionicons name="person" size={16} color={G.midGreen} />
              </View>
              <Text style={[styles.infoCardTitle, { color: G.text }]}>Personal Information</Text>
              <TouchableOpacity onPress={openEditProfile} style={[styles.editBtnSmall, { backgroundColor: G.lightGreen }]}>
                <Ionicons name="create-outline" size={14} color={G.midGreen} />
                <Text style={[styles.editBtnSmallText, { color: G.midGreen }]}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: G.sub }]}>Full Name</Text>
              <Text style={[styles.infoValue, { color: G.text }]}>{user?.name || 'Not set'}</Text>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: G.divider }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: G.sub }]}>Email</Text>
              <Text style={[styles.infoValue, { color: G.text }]}>{user?.email || 'Not set'}</Text>
            </View>
          </View>

          {/* Menu Items */}
          <View style={[styles.menuCard, {
            backgroundColor: G.card,
            ...Platform.select({
              ios: { shadowColor: isDark ? '#000' : G.darkGreen, shadowOffset: { width: 0, height: 3 }, shadowOpacity: isDark ? 0.3 : 0.08, shadowRadius: 12 },
              android: { elevation: 3 },
            }),
          }]}>
            <TouchableOpacity style={styles.menuRow} onPress={pickImage} activeOpacity={0.7}>
              <View style={[styles.menuIconWrap, { backgroundColor: G.midGreen + '15' }]}>
                <Ionicons name="camera-outline" size={20} color={G.midGreen} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: G.text }]}>Change Photo</Text>
                <Text style={[styles.menuSub, { color: G.sub }]}>Update your profile picture</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={G.sub} />
            </TouchableOpacity>

            <View style={[styles.menuRowBorder, { backgroundColor: G.divider }]} />

            <TouchableOpacity style={styles.menuRow} onPress={openEditProfile} activeOpacity={0.7}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#8B5CF6' + '15' }]}>
                <Ionicons name="create-outline" size={20} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: G.text }]}>Edit Profile</Text>
                <Text style={[styles.menuSub, { color: G.sub }]}>Update your name and email</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={G.sub} />
            </TouchableOpacity>

            <View style={[styles.menuRowBorder, { backgroundColor: G.divider }]} />

            {/* ─── Dark Mode Toggle ─── */}
            <View style={styles.menuRow}>
              <View style={[styles.menuIconWrap, { backgroundColor: isDark ? '#3A3A1A' : '#FEF3C7' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={isDark ? '#FBBF24' : '#D97706'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: G.text }]}>Dark Mode</Text>
                <Text style={[styles.menuSub, { color: G.sub }]}>{isDark ? 'Switch to light theme' : 'Switch to dark theme'}</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#D1D5DB', true: G.midGreen }}
                thumbColor={isDark ? '#FBBF24' : '#fff'}
                ios_backgroundColor="#D1D5DB"
              />
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity style={[styles.logoutCard, { backgroundColor: isDark ? '#2A1A1A' : '#FEF2F2', borderColor: isDark ? '#5A2A2A' : '#FECACA' }]} onPress={handleLogout} activeOpacity={0.85}>
            <View style={[styles.logoutIconWrap, { backgroundColor: isDark ? '#3A1A1A' : '#FEE2E2' }]}>
              <Ionicons name="log-out-outline" size={20} color={G.red} />
            </View>
            <Text style={[styles.logoutText, { color: G.red }]}>Logout</Text>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#EF4444' : '#FECACA'} />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ─── Edit Profile Modal ─── */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: G.modalBg }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <LinearGradient colors={[G.darkGreen, G.midGreen] as [string, string]} style={styles.modalHeaderIcon}>
                  <Ionicons name="person" size={18} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: G.text }]}>Edit Profile</Text>
                  <Text style={[styles.modalSubtitle, { color: G.sub }]}>Update your personal information</Text>
                </View>
                <TouchableOpacity onPress={() => setEditModalVisible(false)} style={[styles.modalCloseBtn, { backgroundColor: G.chipBg }]}>
                  <Ionicons name="close" size={20} color={G.sub} />
                </TouchableOpacity>
              </View>

              {/* Name Field */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: G.text }]}>Full Name</Text>
                <View style={[styles.inputWrap, { backgroundColor: G.inputBg, borderColor: G.border }]}>
                  <Ionicons name="person-outline" size={18} color={G.sub} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.textInput, { color: G.text }]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter your name"
                    placeholderTextColor={G.sub}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email Field */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: G.text }]}>Email Address</Text>
                <View style={[styles.inputWrap, { backgroundColor: G.inputBg, borderColor: G.border }]}>
                  <Ionicons name="mail-outline" size={18} color={G.sub} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.textInput, { color: G.text }]}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={G.sub}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { backgroundColor: G.chipBg }]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={[styles.modalCancelText, { color: G.sub }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSaveBtn, isSavingProfile && { opacity: 0.6 }]}
                  onPress={saveProfile}
                  disabled={isSavingProfile}
                >
                  <LinearGradient
                    colors={[G.darkGreen, G.midGreen] as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalSaveGrad}
                  >
                    {isSavingProfile ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                        <Text style={styles.modalSaveText}>Save Changes</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── Logout Confirm Dialog ─── */}
      <ConfirmDialog
        visible={logoutDialogVisible}
        title="Logout"
        message="Are you sure you want to logout? You'll need to sign in again."
        confirmText="Logout"
        cancelText="Cancel"
        destructive
        icon="log-out-outline"
        onConfirm={confirmLogout}
        onCancel={() => setLogoutDialogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Hero
  hero: { paddingBottom: 30, overflow: 'hidden' },
  heroDeco1: { position: 'absolute', top: -40, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.06)' },
  heroDeco2: { position: 'absolute', bottom: -60, left: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.04)' },
  backBtn: {
    position: 'absolute', top: 50, left: 16, zIndex: 10,
    width: 38, height: 38, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Avatar
  avatarSection: { alignItems: 'center', paddingTop: 20 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarFallback: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarInitials: { fontSize: 36, fontWeight: '800', color: '#fff' },
  cameraBadge: {
    position: 'absolute', bottom: 4, right: 4,
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, paddingVertical: 12,
    paddingHorizontal: 24, marginTop: 18, gap: 16,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  statDivider: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Body
  body: { paddingHorizontal: 16, marginTop: 20 },

  // Info Card
  infoCard: { borderRadius: 20, padding: 18, marginBottom: 16 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  infoIconWrap: { width: 34, height: 34, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  infoCardTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  editBtnSmall: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  editBtnSmallText: { fontSize: 12, fontWeight: '700' },
  infoRow: { paddingVertical: 8 },
  infoLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '600' },
  infoDivider: { height: 1, marginVertical: 4 },

  // Menu Card
  menuCard: { borderRadius: 20, paddingVertical: 4, marginBottom: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  menuRowBorder: { height: 1, marginHorizontal: 16 },
  menuIconWrap: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '600' },
  menuSub: { fontSize: 12, marginTop: 2 },

  // Logout
  logoutCard: {
    borderRadius: 20, flexDirection: 'row',
    alignItems: 'center', padding: 16, gap: 14, marginBottom: 20,
    borderWidth: 1,
  },
  logoutIconWrap: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  logoutText: { flex: 1, fontSize: 15, fontWeight: '700' },

  // Image Editor
  editorSection: { marginHorizontal: 16, marginTop: 20, borderRadius: 22, padding: 18 },
  editorTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  preview: { width: '100%', height: width * 0.75, borderRadius: 16, marginBottom: 14 },
  editorRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  editorBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14, borderWidth: 1 },
  editorBtnIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  editorBtnText: { fontSize: 14, fontWeight: '600' },
  editorActions: { flexDirection: 'row', gap: 10 },
  cancelEditBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14 },
  cancelEditText: { fontSize: 15, fontWeight: '600' },
  saveEditBtn: { flex: 2, borderRadius: 14, overflow: 'hidden' },
  saveEditGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  saveEditText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // ─── Edit Profile Modal ───
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  modalHeaderIcon: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  modalSubtitle: { fontSize: 12, marginTop: 2 },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },

  // Fields
  fieldWrap: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8, letterSpacing: -0.1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 4 },
  textInput: { flex: 1, fontSize: 15, paddingVertical: 12 },

  // Modal Actions
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  modalCancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16 },
  modalCancelText: { fontSize: 15, fontWeight: '600' },
  modalSaveBtn: { flex: 2, borderRadius: 16, overflow: 'hidden' },
  modalSaveGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
