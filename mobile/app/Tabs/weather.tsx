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
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { MapPressEvent, Marker } from "react-native-maps";

import { weatherService } from "../services";
import { CitySearchResult, WeatherData } from "../services/types";

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
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("Fetching location...");
  const [landslideRisk, setLandslideRisk] = useState("Calculating...");
  const [region, setRegion] = useState({
    latitude: 24.8607,
    longitude: 67.0011,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });
  const [markerCoord, setMarkerCoord] = useState({
    latitude: 24.8607,
    longitude: 67.0011,
  });

  const [searchCity, setSearchCity] = useState("");
  const [suggestions, setSuggestions] = useState<CitySearchResult[]>([]);
  const [showMap, setShowMap] = useState(false);
  const debounceRef = useRef<any>(null);

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

      setRegion({
        latitude: latitudeNum,
        longitude: longitudeNum,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
      setMarkerCoord({ latitude: latitudeNum, longitude: longitudeNum });

      const weatherData = await weatherService.getWeather(latitudeNum, longitudeNum);
      setWeather(weatherData);

      const risk = weatherService.calculateLandslideRisk(weatherData);
      setLandslideRisk(risk);
    } catch (err: any) {
      console.log(err?.message);
      Alert.alert("Error", "Unable to fetch weather");
    } finally {
      setLoading(false);
    }
  };

  const onMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    fetchWeather(latitude, longitude);
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
    Keyboard.dismiss();
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setSearchCity("");
    setSuggestions([]);
    fetchWeather(lat, lon);
  };

  useEffect(() => {
    fetchWeather();
  }, []);

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
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      {/* Autocomplete Overlay */}
      {suggestions.length > 0 && (
        <View style={[styles.autoBox, { top: insets.top + 70 }]}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => (item as any).uid || item.place_id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.autoItem} onPress={() => selectPlace(item)}>
                <Ionicons name="location-outline" size={16} color="#2D7A4D" style={{ marginRight: 8 }} />
                <Text style={styles.autoText} numberOfLines={1}>{item.display_name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <LinearGradient colors={gradientColors} style={[styles.heroSection, { paddingTop: insets.top + 16 }]}>
          {/* Search Bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
              <TextInput
                placeholder="Search city..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={styles.searchInput}
                value={searchCity}
                onChangeText={onChangeSearch}
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
          <View style={styles.detailsSection}>
            <View style={styles.statsGrid}>
              {/* Humidity */}
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="water-percent" size={28} color="#60a5fa" />
                <Text style={styles.statValue}>{weather.main.humidity}%</Text>
                <Text style={styles.statLabel}>Humidity</Text>
              </View>

              {/* Wind */}
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="weather-windy" size={28} color="#a78bfa" />
                <Text style={styles.statValue}>{weather.wind.speed}</Text>
                <Text style={styles.statLabel}>Wind m/s</Text>
              </View>

              {/* Rain */}
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="weather-rainy" size={28} color="#34d399" />
                <Text style={styles.statValue}>{weather.rain?.["1h"] || 0} mm</Text>
                <Text style={styles.statLabel}>Rain</Text>
              </View>

              {/* Snow */}
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="weather-snowy" size={28} color="#e2e8f0" />
                <Text style={styles.statValue}>{weather.snow?.["1h"] || 0} cm</Text>
                <Text style={styles.statLabel}>Snow</Text>
              </View>
            </View>

            {/* Landslide Risk Banner */}
            <View style={[styles.riskBanner, { borderColor: riskColor }]}>
              <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.riskLabel}>Road landslide risk</Text>
                <Text style={[styles.riskValue, { color: riskColor }]}>{landslideRisk} Risk</Text>
              </View>
              <MaterialCommunityIcons name="alert-circle-outline" size={28} color={riskColor} />
            </View>

            {/* Map Toggle */}
            <TouchableOpacity
              style={styles.mapToggleBtn}
              onPress={() => setShowMap(!showMap)}
            >
              <Ionicons name={showMap ? "map" : "map-outline"} size={18} color="#2D7A4D" />
              <Text style={styles.mapToggleText}>{showMap ? "Hide Map" : "Show on Map"}</Text>
              <Ionicons name={showMap ? "chevron-up" : "chevron-down"} size={18} color="#2D7A4D" />
            </TouchableOpacity>

            {showMap && (
              <MapView
                style={styles.map}
                region={region}
                onPress={onMapPress}
              >
                <Marker coordinate={markerCoord} />
              </MapView>
            )}

            <Text style={styles.mapHint}>Tap anywhere on the map to check weather at that location</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Hero ───
  heroSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // ─── Search ───
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ─── Location ───
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500",
  },

  // ─── Main Weather ───
  mainWeather: {
    alignItems: "center",
    paddingVertical: 10,
  },
  weatherIcon: {
    marginBottom: 8,
  },
  tempText: {
    fontSize: 90,
    fontWeight: "200",
    color: "#fff",
    lineHeight: 95,
    letterSpacing: -2,
  },
  conditionText: {
    fontSize: 18,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "400",
    marginTop: 4,
  },

  // ─── Autocomplete ───
  autoBox: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 20,
    zIndex: 999,
    maxHeight: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  autoItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
  },
  autoText: {
    fontSize: 14,
    color: "#1A1A2E",
    flex: 1,
  },

  // ─── Details Section ───
  detailsSection: {
    backgroundColor: "#f9fafb",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    padding: 20,
    paddingTop: 28,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 40 - 12) / 2,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A2E",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
    marginTop: 2,
  },

  // ─── Risk Banner ───
  riskBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  riskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  riskLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  riskValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },

  // ─── Map Toggle ───
  mapToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  mapToggleText: {
    color: "#2D7A4D",
    fontWeight: "600",
    fontSize: 15,
  },

  map: {
    height: 280,
    borderRadius: 20,
    marginBottom: 10,
    overflow: "hidden",
  },
  mapHint: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 10,
  },
});
