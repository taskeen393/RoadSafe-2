import { Feather, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { MapPressEvent, Marker } from "react-native-maps";

// Import weather service
import { weatherService } from "../services";
import { CitySearchResult, WeatherData } from "../services/types";

export default function WeatherScreen() {
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
  const debounceRef = useRef<any>(null);

  // ================= WEATHER =================
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

      // Reverse geocoding using weatherService
      const locationInfo = await weatherService.reverseGeocode(latitudeNum, longitudeNum);
      setLocationName(`${locationInfo.city}, ${locationInfo.countryName}`);

      setRegion({
        latitude: latitudeNum,
        longitude: longitudeNum,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
      setMarkerCoord({ latitude: latitudeNum, longitude: longitudeNum });

      // Get weather data using weatherService
      const weatherData = await weatherService.getWeather(latitudeNum, longitudeNum);
      setWeather(weatherData);

      // Calculate landslide risk using weatherService
      const risk = weatherService.calculateLandslideRisk(weatherData);
      setLandslideRisk(risk);
    } catch (err: any) {
      console.log(err?.message);
      Alert.alert("Error", "Unable to fetch weather");
    } finally {
      setLoading(false);
    }
  };

  // ================= MAP TAP FUNCTION =================
  const onMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    fetchWeather(latitude, longitude);
  };

  // ================= AUTOCOMPLETE =================
  const onChangeSearch = (text: string) => {
    setSearchCity(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (!text.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        // Use weatherService for city search
        const results = await weatherService.searchCities(text);
        setSuggestions(results);
      } catch (err: any) {
        console.log(err?.message);
      }
    }, 400);
  };

  // ================= SELECT PLACE =================
  const selectPlace = (item: CitySearchResult) => {
    Keyboard.dismiss();

    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    // ✅ Clear search bar and hide suggestions
    setSearchCity(""); // search bar cleared
    setSuggestions([]); // hide autocomplete list

    fetchWeather(lat, lon);
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  // ================= UI =================
  return (
    <View style={{ flex: 1 }}>
      {/* AUTOCOMPLETE OVERLAY */}
      {suggestions.length > 0 && (
        <View style={styles.autoBox}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => (item as any).uid || item.place_id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.autoItem}
                onPress={() => selectPlace(item)}
              >
                <Text>{item.display_name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <LinearGradient
          colors={["#F9FFF9", "#DFF5E3", "#CDEFD5"]}
          style={styles.container}
        >
          {/* SEARCH BAR */}
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Enter city name"
              style={styles.input}
              value={searchCity}
              onChangeText={onChangeSearch}
            />
            <MaterialIcons name="search" size={28} color="#2E8B57" />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#2E8B57" />
          ) : weather ? (
            <View style={styles.cardContainer}>
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={24} color="#2E8B57" />
                <Text style={styles.locationText}>{locationName}</Text>
              </View>

              <Text style={styles.tempText}>
                {Math.round(weather.main.temp)}°C
              </Text>
              <Text style={styles.conditionText}>
                {weather.weather[0].description}
              </Text>

              <View style={styles.detailsRow}>
                <Text style={styles.detailText}>
                  Humidity: {weather.main.humidity}%
                </Text>
                <Text style={styles.detailText}>
                  Wind: {weather.wind.speed} m/s
                </Text>
                <Text style={styles.detailText}>
                  Rain: {weather.rain?.["1h"] || 0} mm
                </Text>
                <Text style={styles.detailText}>
                  Snow: {weather.snow?.["1h"] || 0} cm
                </Text>
                <Text style={[styles.detailText, { fontWeight: "bold" }]}>
                  Landslide: {landslideRisk}
                </Text>
              </View>

              <MapView
                style={styles.map}
                region={region}
                onPress={onMapPress}
              >
                <Marker coordinate={markerCoord} />
              </MapView>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => fetchWeather()}
          >
            <Feather name="refresh-ccw" size={20} color="#fff" />
            <Text style={styles.buttonText}>Refresh</Text>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, paddingBottom: 30 },
  container: { flex: 1, alignItems: "center", padding: 15, marginTop: 50 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    elevation: 4,
    marginBottom: 10,
  },
  input: { flex: 1, paddingVertical: 10, fontSize: 16 },

  autoBox: {
    position: "absolute",
    top: 110,
    width: "95%",
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    elevation: 10,
    zIndex: 999,
    maxHeight: 220,
  },
  autoItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  cardContainer: {
    width: "95%",
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 15,
    elevation: 5,
    marginTop: 10,
  },
  locationRow: { flexDirection: "row", justifyContent: "center", marginBottom: 8 },
  locationText: { fontSize: 22, fontWeight: "700", color: "#2E8B57" },
  tempText: { fontSize: 48, fontWeight: "bold", color: "#2E8B57", textAlign: "center" },
  conditionText: { textAlign: "center", fontSize: 18, marginBottom: 10 },
  detailsRow: { alignItems: "center", gap: 4 },

  detailText: { fontSize: 15, color: "#2E8B57" },

  map: {
    height: 250,
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2E8B57",
  },

  refreshButton: {
    flexDirection: "row",
    backgroundColor: "#2E8B57",
    padding: 12,
    borderRadius: 25,
    marginTop: 15,
    alignItems: "center",
    gap: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
