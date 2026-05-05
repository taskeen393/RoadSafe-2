import {
  Feather,
  MaterialCommunityIcons,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { MapPressEvent, Marker, Heatmap } from "../../components/Map";
import { useToast } from "../../components/ToastContext";
import { useTheme } from "../../context/ThemeContext";

import { weatherService, landslideService } from "../../services";
import { CitySearchResult, WeatherData } from "../../services/types";
import { useDisasterData } from "../hooks/useDisasterData";
import MapLegend from "../../components/MapLegend";
import DisasterMapLayers from "../../components/DisasterMapLayers";

const { width } = Dimensions.get("window");

// Map weather description to icon
function getWeatherIcon(description: string): { icon: string; lib: "mci" } {
  const d = description.toLowerCase();
  if (d.includes("thunder")) return { icon: "weather-lightning-rainy", lib: "mci" };
  if (d.includes("drizzle") || d.includes("rain")) return { icon: "weather-rainy", lib: "mci" };
  if (d.includes("snow")) return { icon: "weather-snowy", lib: "mci" };
  if (d.includes("mist") || d.includes("fog") || d.includes("haze")) return { icon: "weather-fog", lib: "mci" };
  if (d.includes("overcast") || d.includes("cloud")) return { icon: "weather-cloudy", lib: "mci" };
  if (d.includes("partly")) return { icon: "weather-partly-cloudy", lib: "mci" };
  return { icon: "weather-sunny", lib: "mci" };
}

// Map weather to gradient colors
function getGradient(description: string): readonly [string, string, string] {
  const d = description.toLowerCase();
  if (d.includes("thunder")) return ["#1a1a2e", "#16213e", "#0f3460"] as const;
  if (d.includes("rain") || d.includes("drizzle")) return ["#1e3a5f", "#2c5282", "#2b6cb0"] as const;
  if (d.includes("snow")) return ["#2d3748", "#4a5568", "#718096"] as const;
  if (d.includes("cloud") || d.includes("mist") || d.includes("fog")) return ["#2d3748", "#4a5568", "#667eea"] as const;
  return ["#1a365d", "#2d5a27", "#276749"] as const;
}

export default function WeatherScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { colors: G, isDark } = useTheme();
  const { disasters, landslideHistory, refresh: refreshDisasters } = useDisasterData();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("Fetching location...");
  const [landslideRisk, setLandslideRisk] = useState("Calculating...");
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [region, setRegion] = useState({
    latitude: 24.8607, longitude: 67.0011,
    latitudeDelta: 0.5, longitudeDelta: 0.5,
  });
  const [markerCoord, setMarkerCoord] = useState({ latitude: 24.8607, longitude: 67.0011 });

  const [searchCity, setSearchCity] = useState("");
  const [suggestions, setSuggestions] = useState<CitySearchResult[]>([]);
  const [showMap, setShowMap] = useState(true);
  const [currentRisk, setCurrentRisk] = useState<{
    level: 'Low' | 'Medium' | 'High' | 'Critical';
    reasons: string[];
  } | null>(null);
  const [showLandslideLayer, setShowLandslideLayer] = useState(true);
  const debounceRef = useRef<any>(null);
  const searchInputRef = useRef<any>(null);

  const fetchWeather = async (lat?: number, lon?: number) => {
    setLoading(true);
    try {
      let latitudeNum: number;
      let longitudeNum: number;

      if (lat !== undefined && lon !== undefined) {
        latitudeNum = Number(lat);
        longitudeNum = Number(lon);
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          latitudeNum = loc.coords.latitude;
          longitudeNum = loc.coords.longitude;
        } else {
          latitudeNum = 24.8607;
          longitudeNum = 67.0011;
        }
      }

      const locationInfo = await weatherService.reverseGeocode(latitudeNum, longitudeNum);
      setLocationName(`${locationInfo.city}, ${locationInfo.countryName}`);

      setRegion({ latitude: latitudeNum, longitude: longitudeNum, latitudeDelta: 0.5, longitudeDelta: 0.5 });
      setMarkerCoord({ latitude: latitudeNum, longitude: longitudeNum });

      // Fetch Both: Current + Forecast
      const [weatherData, forecastData] = await Promise.all([
        weatherService.getWeather(latitudeNum, longitudeNum),
        weatherService.getForecast(latitudeNum, longitudeNum)
      ]);

      setWeather(weatherData);
      setForecast(forecastData?.list?.slice(0, 8) || []); // Next 24 hours (8 * 3h)

      const risk = weatherService.calculateLandslideRisk(weatherData);
      setLandslideRisk(risk);

      const riskData = await landslideService.calculateCurrentRisk(latitudeNum, longitudeNum);
      setCurrentRisk(riskData);
    } catch (err: any) {
      console.log(err?.message);
      showToast({ type: 'error', title: 'Weather Error', message: 'Unable to fetch weather data' });
    } finally {
      setLoading(false);
    }
  };

  const onMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerCoord({ latitude, longitude });
    setRegion({
      latitude, longitude,
      latitudeDelta: 0.2, longitudeDelta: 0.2
    });
    fetchWeather(latitude, longitude);

    // Instant Proximity Check for Selection
    checkSelectionRisk(latitude, longitude);
  };

  const checkSelectionRisk = (lat: number, lon: number) => {
    const THRESHOLD = 1.5; // 1.5km for manual selection safety margin

    // Check Landslides
    const nearLandslide = landslideHistory.find(spot => {
      const dist = calculateDistance(lat, lon, spot.lat, spot.lon);
      return dist <= THRESHOLD;
    });

    if (nearLandslide) {
      showToast({
        type: 'warning',
        title: 'High Risk Selection / خطرناک مقام',
        message: `Selected point is near a historical landslide site (${nearLandslide.location}). Please be cautious.\nآپ کا منتخب کردہ مقام لینڈ سلائیڈنگ والے علاقے کے قریب ہے۔`,
      });
      return;
    }

    // Check Active Disasters
    const nearDisaster = disasters.find(d => {
      const dist = calculateDistance(lat, lon, d.lat, d.lon);
      return dist <= THRESHOLD * 3; // 4.5km for active disasters
    });

    if (nearDisaster) {
      showToast({
        type: 'error',
        title: 'Active Danger / شدید خطرہ',
        message: `This location is near an ACTIVE disaster event: ${nearDisaster.title}. Safety is not guaranteed.`,
      });
    }
  };

  /**
   * Helper: Haversine distance
   */
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const onChangeSearch = (text: string) => {
    setSearchCity(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!text.trim()) { setSuggestions([]); return; }
      try {
        const results = await weatherService.searchCities(text);
        setSuggestions(results);
      } catch (err: any) {
        console.log(err?.message);
      }
    }, 400);
  };

  const selectPlace = (item: CitySearchResult) => {
    // ✅ Clear list immediately
    setSuggestions([]);
    setSearchCity("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    Keyboard.dismiss();
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    fetchWeather(lat, lon);
  };

  // Called when user presses search icon or keyboard Submit
  const handleSearchSubmit = async () => {
    const query = searchCity.trim();
    if (!query) return;

    // ✅ Clear list + input immediately
    setSuggestions([]);
    setSearchCity("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    Keyboard.dismiss();

    if (suggestions.length > 0) {
      // Use first suggestion from existing list
      const item = suggestions[0];
      fetchWeather(parseFloat(item.lat), parseFloat(item.lon));
    } else {
      // Search by full typed name via LocationIQ
      try {
        const results = await weatherService.searchCities(query);
        if (results.length > 0) {
          fetchWeather(parseFloat(results[0].lat), parseFloat(results[0].lon));
        }
      } catch {
        // fallback to current location
        fetchWeather();
      }
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Red': return '#ef4444';
      case 'Orange': return '#f97316';
      case 'Yellow': return '#fbbf24';
      case 'Green': return '#22c55e';
      default: return '#94a3b8';
    }
  };

  useEffect(() => { fetchWeather(); }, []);

  const gradientColors = weather
    ? getGradient(weather.weather[0].description)
    : ["#1a365d", "#2d5a27", "#276749"] as const;

  const weatherIcon = weather
    ? getWeatherIcon(weather.weather[0].description)
    : { icon: "weather-sunny", lib: "mci" };

  const riskColor =
    landslideRisk === "Low" ? "#4ade80"
      : landslideRisk === "Moderate" ? "#fbbf24"
        : landslideRisk === "High" ? "#f97316"
          : "#ef4444";

  return (
    <View style={{ flex: 1, backgroundColor: G.bg }}>
      {/* Autocomplete Overlay */}
      {suggestions.length > 0 && (
        <View style={[styles.autoBox, { top: insets.top + 70, backgroundColor: G.card }]}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => (item as any).uid || item.place_id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.autoItem, { borderColor: G.divider }]} onPress={() => selectPlace(item)}>
                <Ionicons name="location-outline" size={16} color={G.midGreen} style={{ marginRight: 8 }} />
                <Text style={[styles.autoText, { color: G.text }]} numberOfLines={1}>{item.display_name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <LinearGradient colors={gradientColors} style={[styles.heroSection, { paddingTop: insets.top + 16 }]}>
          {/* Search Bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              {/* Search icon — just an icon, pressable to focus input */}
              <TouchableOpacity
                onPress={() => searchInputRef.current?.focus()}
                activeOpacity={0.6}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
              >
                <Ionicons name="search" size={18} color="rgba(255,255,255,0.75)" />
              </TouchableOpacity>
              <TextInput
                ref={searchInputRef}
                placeholder="Search city, area or country..."
                placeholderTextColor="rgba(255,255,255,0.45)"
                style={styles.searchInput}
                value={searchCity}
                onChangeText={onChangeSearch}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchCity.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchCity(""); setSuggestions([]); }}>
                  <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchWeather()}>
              <Feather name="refresh-ccw" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.locationText}>{locationName}</Text>
          </View>

          {/* Main Weather Display */}
          {loading ? (
            <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 60 }} />
          ) : weather ? (
            <View style={styles.mainWeather}>
              <MaterialCommunityIcons
                name={weatherIcon.icon as any}
                size={100}
                color="rgba(255,255,255,0.9)"
                style={styles.weatherIcon}
              />
              <Text style={styles.tempText}>
                {Math.round(weather.main.temp)}°
              </Text>
              <Text style={styles.conditionText}>
                {weather.weather[0].description.charAt(0).toUpperCase() + weather.weather[0].description.slice(1)}
              </Text>
            </View>
          ) : null}
        </LinearGradient>

        {/* Detail Cards */}
        {weather && !loading && (
          <View style={[styles.detailsSection, { backgroundColor: G.bg }]}>
            <View style={styles.statsGrid}>
              {/* Humidity */}
              <View style={[styles.statCard, {
                backgroundColor: G.card,
                ...Platform.select({
                  ios: { shadowColor: isDark ? '#000' : '#000', shadowOpacity: isDark ? 0.2 : 0.06 },
                  android: {},
                }),
              }]}>
                <MaterialCommunityIcons name="water-percent" size={28} color="#60a5fa" />
                <Text style={[styles.statValue, { color: G.text }]}>{weather.main.humidity}%</Text>
                <Text style={[styles.statLabel, { color: G.sub }]}>Humidity</Text>
              </View>

              {/* Wind */}
              <View style={[styles.statCard, {
                backgroundColor: G.card,
                ...Platform.select({
                  ios: { shadowColor: isDark ? '#000' : '#000', shadowOpacity: isDark ? 0.2 : 0.06 },
                  android: {},
                }),
              }]}>
                <MaterialCommunityIcons name="weather-windy" size={28} color="#a78bfa" />
                <Text style={[styles.statValue, { color: G.text }]}>{weather.wind.speed}</Text>
                <Text style={[styles.statLabel, { color: G.sub }]}>Wind m/s</Text>
              </View>

              {/* Rain */}
              <View style={[styles.statCard, {
                backgroundColor: G.card,
                ...Platform.select({
                  ios: { shadowColor: isDark ? '#000' : '#000', shadowOpacity: isDark ? 0.2 : 0.06 },
                  android: {},
                }),
              }]}>
                <MaterialCommunityIcons name="weather-rainy" size={28} color="#34d399" />
                <Text style={[styles.statValue, { color: G.text }]}>{weather.rain?.["1h"] || 0} mm</Text>
                <Text style={[styles.statLabel, { color: G.sub }]}>Rain</Text>
              </View>

              {/* Snow */}
              <View style={[styles.statCard, {
                backgroundColor: G.card,
                ...Platform.select({
                  ios: { shadowColor: isDark ? '#000' : '#000', shadowOpacity: isDark ? 0.2 : 0.06 },
                  android: {},
                }),
              }]}>
                <MaterialCommunityIcons name="weather-snowy" size={28} color={isDark ? '#94a3b8' : '#e2e8f0'} />
                <Text style={[styles.statValue, { color: G.text }]}>{weather.snow?.["1h"] || 0} cm</Text>
                <Text style={[styles.statLabel, { color: G.sub }]}>Snow / برف</Text>
              </View>
            </View>

            {/* Landslide Risk Banner */}
            <View style={[styles.riskBanner, { backgroundColor: G.card, borderColor: riskColor, marginTop: 10 }]}>
              <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.riskLabel, { color: G.sub }]}>Road landslide risk</Text>
                <Text style={[styles.riskValue, { color: riskColor }]}>{landslideRisk} Risk</Text>
              </View>
              <MaterialCommunityIcons name="alert-circle-outline" size={28} color={riskColor} />
            </View>

            {/* Hourly Forecast / آنے والے اوقات */}
            <View style={styles.hourlySection}>
              <Text style={[styles.inlineHeader, { color: G.text }]}>Next 24 Hours / آنے والے اوقات</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={forecast}
                keyExtractor={(item) => item.dt.toString()}
                renderItem={({ item }) => {
                  const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: 'numeric', hour12: true });
                  const iconInfo = getWeatherIcon(item.weather[0].description);
                  return (
                    <View style={[styles.forecastCard, { backgroundColor: G.card, borderColor: G.border }]}>
                      <Text style={[styles.forecastTime, { color: G.sub }]}>{time}</Text>
                      <MaterialCommunityIcons name={iconInfo.icon as any} size={28} color={G.midGreen} />
                      <Text style={[styles.forecastTemp, { color: G.text }]}>{Math.round(item.main.temp)}°</Text>
                    </View>
                  );
                }}
              />
            </View>
            {/* NDMA Disaster Alerts Horizontal Cards */}
            {disasters.length > 0 && (
              <View style={styles.alertSection}>
                <Text style={[styles.sectionTitle, { color: G.text }]}>
                  {lang === 'en' ? 'Live NDMA Alerts' : 'این ڈی ایم اے لائیو الرٹس'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.alertList}>
                  {disasters.map((alert) => (
                    <TouchableOpacity
                      key={alert.id}
                      style={[styles.alertCard, { backgroundColor: G.card, borderColor: getSeverityColor(alert.severity) }]}
                      onPress={() => {
                        setRegion({ latitude: alert.lat, longitude: alert.lon, latitudeDelta: 5.0, longitudeDelta: 5.0 });
                        setMarkerCoord({ latitude: alert.lat, longitude: alert.lon });
                        setShowMap(true);
                      }}
                    >
                      <View style={[styles.alertIconWrap, { backgroundColor: getSeverityColor(alert.severity) + '20' }]}>
                        <MaterialCommunityIcons name="alert-decagram" size={24} color={getSeverityColor(alert.severity)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.alertTitle, { color: G.text }]} numberOfLines={1}>{alert.title}</Text>
                        <Text style={[styles.alertSubtitle, { color: G.sub }]}>{alert.type} • {new Date(alert.dateTime).toLocaleDateString()}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ─── Map Section ─── */}
            <View style={[styles.mapSection, { backgroundColor: G.card, borderColor: G.border }]}>
              {/* Section Header */}
              <TouchableOpacity
                style={styles.mapSectionHeader}
                onPress={() => setShowMap(!showMap)}
                activeOpacity={0.8}
              >
                <View style={[styles.mapHeaderIconWrap, { backgroundColor: G.lightGreen }]}>
                  <Ionicons name="map" size={18} color={G.midGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.mapHeaderTitle, { color: G.text }]}>Disaster & Traffic Map</Text>
                  <Text style={[styles.mapHeaderSub, { color: G.sub }]}>Tap map to check weather anywhere</Text>
                </View>
                <View style={[styles.mapChevronBtn, { backgroundColor: G.lightGreen }]}>
                  <Ionicons name={showMap ? 'chevron-up' : 'chevron-down'} size={16} color={G.midGreen} />
                </View>
              </TouchableOpacity>

              {/* Collapsible Map Body */}
              {showMap && (
                <View>
                  {/* Map with overlay controls */}
                  <View style={styles.mapWrapper}>
                    <MapView
                      style={styles.mapFull}
                      showsTraffic={true}
                      showsUserLocation={true}
                      region={region}
                      onPress={onMapPress}
                    >
                      <Marker coordinate={markerCoord} title={locationName} />
                      <DisasterMapLayers
                        disasters={disasters}
                        landslideHistory={landslideHistory}
                        showLandslideHistory={showLandslideLayer}
                      />
                    </MapView>

                    {/* Overlay: hint pill at top */}
                    <View style={styles.mapHintPill}>
                      <Ionicons name="finger-print" size={12} color="#fff" />
                      <Text style={styles.mapHintPillText}>Tap map for weather</Text>
                    </View>

                    {/* Overlay: right-side floating buttons */}
                    <View style={styles.mapFloatBtns}>
                      {/* My Location */}
                      <TouchableOpacity
                        style={[styles.mapFloatBtn, { backgroundColor: G.card }]}
                        onPress={() => fetchWeather()}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="locate" size={18} color={G.midGreen} />
                      </TouchableOpacity>

                      {/* Landslide Layer Toggle */}
                      <TouchableOpacity
                        style={[styles.mapFloatBtn, { backgroundColor: showLandslideLayer ? G.midGreen : G.card }]}
                        onPress={() => setShowLandslideLayer(!showLandslideLayer)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name="terrain"
                          size={18}
                          color={showLandslideLayer ? '#fff' : G.sub}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Legend below map */}
                  <MapLegend style={styles.boxedLegend} />
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Hero
  heroSection: { paddingHorizontal: 20, paddingBottom: 40 },

  // Search
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },
  refreshBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },

  // Location
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  locationText: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "500" },

  // Main Weather
  mainWeather: { alignItems: "center", paddingVertical: 10 },
  weatherIcon: { marginBottom: 8 },
  tempText: { fontSize: 90, fontWeight: "200", color: "#fff", lineHeight: 95, letterSpacing: -2 },
  conditionText: { fontSize: 18, color: "rgba(255,255,255,0.8)", fontWeight: "400", marginTop: 4 },

  // Autocomplete
  autoBox: {
    position: "absolute", left: 16, right: 16, borderRadius: 16, elevation: 20, zIndex: 999, maxHeight: 220,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
  },
  autoItem: { padding: 14, borderBottomWidth: 1, flexDirection: "row", alignItems: "center" },
  autoText: { fontSize: 14, flex: 1 },

  // Details Section
  detailsSection: { borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -20, padding: 20, paddingTop: 28 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  statCard: {
    width: (width - 40 - 12) / 2, borderRadius: 20, padding: 18, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowRadius: 10, elevation: 3,
  },
  statValue: { fontSize: 22, fontWeight: "700", marginTop: 8 },
  statLabel: { fontSize: 12, fontWeight: "500", marginTop: 2 },

  // Risk Banner
  riskBanner: {
    flexDirection: "row", alignItems: "center", borderRadius: 20, padding: 18, marginBottom: 14,
    borderWidth: 1.5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, gap: 12,
  },
  riskDot: { width: 12, height: 12, borderRadius: 6 },
  riskLabel: { fontSize: 12, fontWeight: "500" },
  riskValue: { fontSize: 18, fontWeight: "700", marginTop: 2 },
  alertDescription: { fontSize: 13, lineHeight: 18 },
  mapToggle: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, marginTop: 25, marginBottom: 10
  },
  mapLabel: { fontSize: 16, fontWeight: "700" },

  // ── New Premium Map Section ──
  mapSection: {
    marginHorizontal: 20, marginTop: 16, marginBottom: 20,
    borderRadius: 24, borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16 },
      android: { elevation: 6 },
    }),
  },
  mapSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  mapHeaderIconWrap: {
    width: 40, height: 40, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  mapHeaderTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  mapHeaderSub: { fontSize: 12, marginTop: 2 },
  mapChevronBtn: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  mapWrapper: { height: 370, position: 'relative' },
  mapFull: { flex: 1 },

  // Floating overlay controls
  mapHintPill: {
    position: 'absolute', top: 12, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.48)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  mapHintPillText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  mapFloatBtns: {
    position: 'absolute', right: 12, top: '50%',
    gap: 10,
  },
  mapFloatBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 5 },
    }),
  },

  // Keep old map style for other maps
  mapContainer: {
    height: 300, marginHorizontal: 20, borderRadius: 24, overflow: "hidden",
    elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)"
  },
  map: { flex: 1 },
  boxedLegend: {
    position: 'relative', top: 0, right: 0,
    marginHorizontal: 16, marginTop: 12, marginBottom: 12,
    padding: 14, borderRadius: 18, minWidth: '90%',
    elevation: 3, shadowOpacity: 0.05,
    borderWidth: 1.5,
  },

  // Forecast Styles
  hourlySection: { marginTop: 20, paddingLeft: 20 },
  inlineHeader: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  forecastCard: {
    width: 85, height: 110, borderRadius: 18,
    padding: 12, marginRight: 12, alignItems: "center",
    justifyContent: "space-between", borderWidth: 1.2
  },
  forecastTime: { fontSize: 11, fontWeight: "600" },
  forecastTemp: { fontSize: 16, fontWeight: "700" },

  // Map Toggle
  mapToggleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 20, gap: 8, marginBottom: 14 },
  mapToggleText: { fontWeight: "600", fontSize: 15 },

  mapHint: { textAlign: "center", fontSize: 12, marginBottom: 10 },

  // Disaster Alerts
  alertSection: { marginTop: 25, paddingHorizontal: 0 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 15, paddingHorizontal: 20 },
  alertList: { paddingLeft: 20 },
  alertCard: {
    width: 280, flexDirection: 'row', alignItems: 'center',
    padding: 15, borderRadius: 20, marginRight: 15,
    borderWidth: 1, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
  },
  alertIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  alertTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  alertSubtitle: { fontSize: 12 },

  // Landslide Specific
  predictionAlert: { margin: 20, borderRadius: 24, padding: 20, borderWidth: 2, borderStyle: 'solid' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  alertTitleUr: { fontSize: 18, fontWeight: '800', color: '#fff' },
  alertText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20, marginBottom: 12 },
  reasonList: { gap: 4 },
  reasonText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' },
  mapControlRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 15 },
  histMarker: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff' },
});
