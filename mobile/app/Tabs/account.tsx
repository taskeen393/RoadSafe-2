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

// Import auth service
import { authService } from "../services";

const { width } = Dimensions.get("window");

export default function AccountScreen() {
  const router = useRouter();

  const [image, setImage] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("User Name");
  const [userEmail, setUserEmail] = useState<string>("user@email.com");

  // Load user info + profile image
  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync("profileImage");
      if (saved) setImage(saved);

      // Use authService to get current user
      const user = await authService.getCurrentUser();
      if (user) {
        setUserName(user.name || "User Name");
        setUserEmail(user.email || "user@email.com");
      }
    })();
  }, []);

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

  // Save Edited Image
  const saveImage = async () => {
    if (!editingImage) return;
    await SecureStore.setItemAsync("profileImage", editingImage);
    setImage(editingImage);
    setEditingImage(null);
    Alert.alert("Saved", "Profile picture updated");
  };

  // Logout using authService
  const handleLogout = async () => {
    await authService.logout();
    router.replace("/auth/login");
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
          {image ? (
            <Image source={{ uri: image }} style={styles.avatar} />
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
            <Text style={styles.value}>{userName}</Text>

            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{userEmail}</Text>
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

              <TouchableOpacity style={styles.saveBtn} onPress={saveImage}>
                <Text style={styles.saveText}>Save</Text>
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
    borderRadius: 25,
    paddingVertical: 30,
    paddingHorizontal: 25,
    width: width * 0.95,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#2E8B57",
    shadowOpacity: 0.2,
    shadowRadius: 15,
    marginBottom: 20,
    marginTop: 50
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E8B57",
    marginBottom: 20,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginBottom: 15,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E8B57",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
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
    color: "#336B48",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
  },
  value: {
    color: "#2E8B57",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },
  preview: {
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: 15,
    marginVertical: 15,
  },
  editorRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  editorBtn: {
    flexDirection: "row",
    backgroundColor: "#2E8B57",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", marginLeft: 5 },
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
    backgroundColor: "#2E8B57",
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 20,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "bold", marginLeft: 6 },
});
