import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Import auth context
import { useAuth } from "../context/AuthContext";
import { userService } from "../services";

const { width } = Dimensions.get("window");

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();

  const [image, setImage] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Helper to validate a profile image URL
  const isValidImage = (url: string | undefined | null): boolean => {
    return !!url && url !== 'null' && url !== 'undefined' && url.startsWith('http');
  };

  // Load profile image from user object or SecureStore (fallback)
  useEffect(() => {
    setImageError(false);
    (async () => {
      // First try to get from user object (from backend)
      if (isValidImage(user?.profileImage)) {
        setImage(user!.profileImage!);
      } else {
        // Fallback to SecureStore for backwards compatibility
        const saved = await SecureStore.getItemAsync("profileImage");
        if (saved && isValidImage(saved)) {
          setImage(saved);
        } else {
          setImage(null);
        }
      }
    })();
  }, [user]);

  // Pick Image + Built-in Crop
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required");
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

  // Rotate Image
  const rotateImage = async () => {
    if (!editingImage) return;
    const result = await ImageManipulator.manipulateAsync(
      editingImage,
      [{ rotate: 90 }],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );
    setEditingImage(result.uri);
  };

  // Flip Image
  const flipImage = async () => {
    if (!editingImage) return;
    const result = await ImageManipulator.manipulateAsync(
      editingImage,
      [{ flip: ImageManipulator.FlipType.Horizontal }],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );
    setEditingImage(result.uri);
  };

  // Save Edited Image to Cloudinary
  const saveImage = async () => {
    if (!editingImage) return;

    setIsUploading(true);
    try {
      // Upload to Cloudinary via backend
      const result = await userService.updateProfile({
        profileImageUri: editingImage,
      });

      if (result.user?.profileImage) {
        setImage(result.user.profileImage);
        // Also save to SecureStore for backwards compatibility
        await SecureStore.setItemAsync("profileImage", result.user.profileImage);

        // Update AuthContext with new user data
        await refreshUser();
      }

      setEditingImage(null);
      Alert.alert("Success", "Profile picture updated successfully");
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      Alert.alert("Error", error.msg || "Failed to update profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  // Logout using AuthContext
  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/auth/login");
    } catch (error) {
      console.log("Logout error:", error);
      // Still redirect even if logout fails
      router.replace("/auth/login");
    }
  };

  return (
    <LinearGradient colors={["#E8F5E9", "#F9FFF9"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Heading */}
          <Text style={styles.heading}>My Account</Text>

          {/* Profile Image */}
          {image && !imageError ? (
            <Image
              source={{ uri: image }}
              style={styles.avatar}
              onError={() => setImageError(true)}
            />
          ) : (
            <Ionicons name="person-circle-outline" size={130} color="#2E8B57" />
          )}

          {/* Upload / Change Photo */}
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
            <Text style={styles.uploadText}>Upload / Change Photo</Text>
          </TouchableOpacity>

          {/* User Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user?.name || "User Name"}</Text>

            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || "user@email.com"}</Text>
          </View>

          {/* Image Editor */}
          {editingImage && (
            <>
              <Image source={{ uri: editingImage }} style={styles.preview} />

              <View style={styles.editorRow}>
                <TouchableOpacity style={styles.editorBtn} onPress={rotateImage}>
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.btnText}>Rotate</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.editorBtn} onPress={flipImage}>
                  <Ionicons name="swap-horizontal" size={20} color="#fff" />
                  <Text style={styles.btnText}>Flip</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, isUploading && { opacity: 0.7 }]}
                onPress={saveImage}
                disabled={isUploading}
              >
                <Text style={styles.saveText}>
                  {isUploading ? 'Uploading...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 25,
    width: width * 0.92,
    alignItems: "center",
    shadowColor: '#2D7A4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
    marginTop: 50,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#2D7A4D',
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2D7A4D",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 25,
    marginBottom: 20,
  },
  uploadText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  infoSection: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: "#1A1A2E",
    fontSize: 17,
    fontWeight: "600",
    marginTop: 4,
  },
  preview: {
    width: width * 0.82,
    height: width * 0.82,
    borderRadius: 16,
    marginVertical: 15,
  },
  editorRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  editorBtn: {
    flexDirection: "row",
    backgroundColor: "#2D7A4D",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", marginLeft: 5, fontWeight: '600' },
  saveBtn: {
    backgroundColor: "#1B5E20",
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginBottom: 15,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  logoutBtn: {
    flexDirection: "row",
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 25,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "bold", marginLeft: 6 },
});
