import { AntDesign, FontAwesome5, Foundation, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://img.youtube.com/vi/SxF2sK79r_o/maxresdefault.jpg' }}
        style={styles.header}
        imageStyle={{ borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }}
      />

      <View style={styles.textCard}>
        <Text style={styles.title}>RoadSafe Dashboard</Text>
        <Text style={styles.subtitle}>Stay safe on the road, explore features below!</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => router.push('/Tabs/feed')} style={styles.box}>
            <MaterialCommunityIcons name="account-multiple-outline" size={28} color="#2E8B57" style={{ marginBottom: 8 }} />
            <Text style={styles.point}>Feed</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/Tabs/weather')} style={styles.box}>
            <MaterialCommunityIcons name="weather-partly-snowy" size={28} color="#2E8B57" style={{ marginBottom: 8 }} />
            <Text style={styles.point}>Weather & Road Updates</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/Tabs/report')} style={styles.box}>
            <AntDesign name="alert" size={28} color="#2E8B57" style={{ marginBottom: 8 }} />
            <Text style={styles.point}>Report Incident</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/Tabs/track')} style={styles.box}>
            <Foundation name="map" size={28} color="#2E8B57" style={{ marginBottom: 8 }} />
            <Text style={styles.point}>Track Your Trip</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/Tabs/trip')} style={styles.box}>
            <FontAwesome5 name="route" size={28} color="#2E8B57" style={{ marginBottom: 8 }} />
            <Text style={styles.point}>Trip Summary</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/Tabs/chatbot')} style={styles.box}>
            <MaterialCommunityIcons name="robot" size={28} color="#2E8B57" style={{ marginBottom: 8 }} />
            <Text style={styles.point}>AI Chatbot</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/Tabs/safetytips')} style={styles.box}>
            <MaterialCommunityIcons name="shield-check" size={28} color="#2E8B57" style={{ marginBottom: 8 }} />
            <Text style={styles.point}>Safety Guidelines</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FFF9', paddingHorizontal: 15, marginTop: 50 },
  header: { width: '100%', height: 220, backgroundColor: '#CDEFD5', shadowColor: '#2E8B57', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  textCard: { alignItems: 'center', marginHorizontal: 20, marginTop: 15, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2E8B57', textAlign: 'center', marginTop: 5 },
  subtitle: { fontSize: 16, color: '#336B48', marginTop: 5, textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', marginTop: 25, borderRadius: 25, padding: 20, shadowColor: '#2E8B57', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  box: { width: '46%', alignItems: 'center', marginVertical: 10, paddingVertical: 18, borderRadius: 20, backgroundColor: '#E6F4EA', shadowColor: '#2E8B57', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  point: { fontSize: 16, fontWeight: '600', color: '#2E8B57', textAlign: 'center' },
});
