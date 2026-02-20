// app/Tabs/index.tsx  — RoadSafe Home Dashboard (Light + Dark Green)
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { weatherService, reportService } from '../services';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// ─── Theme ───
const G = {
  bg: '#F4F7F4',
  card: '#FFFFFF',
  darkGreen: '#1A4D2E',
  midGreen: '#2D7A4D',
  lightGreen: '#E8F5ED',
  text: '#1A1A1A',
  sub: '#6B7280',
  border: '#E5EDEA',
};

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();

  // Refresh user data on focus to get latest profileImage after login
  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [])
  );

  const [weatherData, setWeatherData] = useState<any>(null);
  const [locationName, setLocationName] = useState('');
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setWeatherLoading(true);
        const Location = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        let lat = 24.8607, lon = 67.0011;
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude; lon = loc.coords.longitude;
        }
        const info = await weatherService.reverseGeocode(lat, lon);
        setLocationName(`${info.city}, ${info.countryName}`);
        const data = await weatherService.getWeather(lat, lon);
        setWeatherData(data);
      } catch { /* silent */ }
      finally { setWeatherLoading(false); }
    };
    fetchWeather();
  }, []);

  useEffect(() => { setImageError(false); }, [user]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const fetchAlerts = async () => {
        try {
          setAlertsLoading(true);
          const data = await reportService.getReports();
          if (mounted) {
            const latest = data.slice(-5).reverse().map((r: any) => ({
              _id: String(r._id),
              title: r.title || r.description?.slice(0, 40) || 'Report',
              location: r.location || 'Unknown',
              time: r.createdAt,
            }));
            setRecentAlerts(latest);
          }
        } catch { /* silent */ }
        finally { if (mounted) setAlertsLoading(false); }
      };
      fetchAlerts();
      return () => { mounted = false; };
    }, [])
  );

  const firstName = user?.name?.split(' ')[0] || 'Traveler';
  const rawProfileImage = (user as any)?.profileImage;
  const profileImage =
    rawProfileImage && rawProfileImage !== 'null' && rawProfileImage !== 'undefined'
      ? rawProfileImage : null;

  const alertGradients: [string, string][] = [
    ['#E95B5B', '#C0392B'],
    ['#8B5CF6', '#6D28D9'],
    ['#3B9EE8', '#1A6FB8'],
    ['#10B981', '#047857'],
    ['#F59E0B', '#D97706'],
  ];

  const quickActions = [
    { label: 'Report\nIncident', icon: 'warning', colors: ['#E95B5B', '#C0392B'] as [string, string], route: '/Tabs/report', lib: 'ion' },
    { label: 'Track\nTrip', icon: 'route', colors: ['#3B9EE8', '#1A6FB8'] as [string, string], route: '/Tabs/trip', lib: 'fa5' },
    { label: 'Safety\nGuide', icon: 'shield-check', colors: ['#1A4D2E', '#2D7A4D'] as [string, string], route: '/Tabs/safetytips', lib: 'mci' },
    { label: 'Weather\nUpdate', icon: 'weather-partly-cloudy', colors: ['#8B5CF6', '#6D28D9'] as [string, string], route: '/Tabs/weather', lib: 'mci' },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ─── Header ─── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
            <Text style={styles.sub}>Stay safe on the road today</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/Tabs/account')}>
            {profileImage && !imageError ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} onError={() => setImageError(true)} />
            ) : (
              <LinearGradient colors={[G.midGreen, G.darkGreen]} style={styles.avatarFallback}>
                <Ionicons name="person" size={20} color="#fff" />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {/* ─── Weather Card ─── */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/Tabs/weather')} style={styles.weatherCard}>
          <LinearGradient colors={[G.darkGreen, G.midGreen]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.weatherGrad}>
            {weatherLoading ? (
              <ActivityIndicator color="#fff" size="small" style={{ flex: 1 }} />
            ) : weatherData ? (
              <>
                <MaterialCommunityIcons name="weather-partly-cloudy" size={46} color="rgba(255,255,255,0.9)" />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.wTemp}>{Math.round(weatherData.main.temp)}°C</Text>
                  <Text style={styles.wDesc} numberOfLines={1}>
                    {weatherData.weather[0].description.charAt(0).toUpperCase() + weatherData.weather[0].description.slice(1)}
                  </Text>
                  {locationName ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }}>
                      <Ionicons name="location" size={11} color="rgba(255,255,255,0.55)" />
                      <Text style={styles.wLoc} numberOfLines={1}>{locationName}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 5 }}>
                  <Text style={styles.wStat}>💧 {weatherData.main.humidity}%</Text>
                  <Text style={styles.wStat}>💨 {weatherData.wind.speed}m/s</Text>
                </View>
              </>
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, flex: 1 }}>Tap to check weather</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* ─── Quick Actions ─── */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((item, i) => (
            <TouchableOpacity key={i} activeOpacity={0.82} style={styles.quickWrapper} onPress={() => router.push(item.route as any)}>
              <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickCard}>
                <View style={styles.iconBubble}>
                  {item.lib === 'ion' && <Ionicons name={item.icon as any} size={20} color="#fff" />}
                  {item.lib === 'fa5' && <FontAwesome5 name={item.icon as any} size={18} color="#fff" />}
                  {item.lib === 'mci' && <MaterialCommunityIcons name={item.icon as any} size={20} color="#fff" />}
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Active Alerts ─── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Active Alerts</Text>
          <TouchableOpacity onPress={() => router.push('/Tabs/feed')}>
            <Text style={styles.seeAll}>View All →</Text>
          </TouchableOpacity>
        </View>

        {alertsLoading ? (
          <ActivityIndicator color={G.midGreen} style={{ marginVertical: 24 }} />
        ) : recentAlerts.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 4, paddingBottom: 6 }}>
            {recentAlerts.map((alert, i) => (
              <TouchableOpacity key={alert._id} activeOpacity={0.85} onPress={() => router.push('/Tabs/feed')} style={styles.alertOuter}>
                <LinearGradient colors={alertGradients[i % alertGradients.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.alertCard}>
                  <View style={styles.alertDeco} />
                  <View style={styles.alertIconCircle}>
                    <Ionicons name="warning" size={15} color="#fff" />
                  </View>
                  <Text style={styles.alertTitle} numberOfLines={2}>{alert.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 8 }}>
                    <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.65)" />
                    <Text style={styles.alertLoc} numberOfLines={1}>{alert.location}</Text>
                  </View>
                  {alert.time && (
                    <Text style={styles.alertDate}>
                      {new Date(alert.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyAlerts}>
            <MaterialCommunityIcons name="check-circle-outline" size={36} color={G.midGreen} />
            <Text style={styles.emptyText}>All clear! No active alerts 🎉</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: G.bg,
    paddingHorizontal: 20,
    paddingTop: 8,   // extra space so heading stays below status bar icons
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: G.text,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 13,
    color: G.sub,
    marginTop: 3,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: G.midGreen,
  },
  avatarFallback: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },

  // Weather
  weatherCard: {
    borderRadius: 22, marginBottom: 28, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: G.darkGreen, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 14 },
      android: { elevation: 7 },
    }),
  },
  weatherGrad: {
    flexDirection: 'row', alignItems: 'center', padding: 20,
  },
  wTemp: { fontSize: 28, fontWeight: '700', color: '#fff' },
  wDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  wLoc: { fontSize: 11, color: 'rgba(255,255,255,0.5)', maxWidth: 120 },
  wStat: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  // Section
  sectionLabel: {
    fontSize: 16, fontWeight: '700', color: G.text,
    marginBottom: 14, letterSpacing: -0.2,
  },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 28, marginBottom: 14,
  },
  seeAll: { fontSize: 13, color: G.midGreen, fontWeight: '600' },

  // Quick Actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 4 },
  quickWrapper: {
    width: (width - 40 - 14) / 2, borderRadius: 22,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.12, shadowRadius: 12 },
      android: { elevation: 5 },
    }),
  },
  quickCard: { borderRadius: 22, padding: 20, height: 128, justifyContent: 'space-between' },
  iconBubble: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center',
  },
  quickLabel: { fontSize: 14, fontWeight: '700', color: '#fff', lineHeight: 20 },

  // Alert Cards
  alertOuter: {
    marginRight: 14, borderRadius: 22, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  alertCard: { width: 155, minHeight: 155, padding: 16, borderRadius: 22, justifyContent: 'flex-end', overflow: 'hidden' },
  alertDeco: {
    position: 'absolute', top: -22, right: -22,
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  alertIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#fff', lineHeight: 18 },
  alertLoc: { fontSize: 11, color: 'rgba(255,255,255,0.65)', flex: 1 },
  alertDate: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 5 },

  // Empty
  emptyAlerts: {
    backgroundColor: G.card, borderRadius: 22, padding: 28,
    alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: G.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  emptyText: { fontSize: 14, color: G.sub, textAlign: 'center' },
});
