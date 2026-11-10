import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, ActivityIndicator, Alert } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";

// Calculates the distance between two coordinates using the Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1); // Returns distance in kilometers rounded to 1 decimal place
};

// Translates WMO weather codes into words
const getWeatherCondition = (code) => {
  if (code === 0) return "Clear";
  if (code === 1 || code === 2 || code === 3) return "Cloudy";
  if (code >= 45 && code <= 48) return "Foggy";
  if (code >= 51 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 95) return "Thunderstorm";
  return "Unknown";
};

// Fetches current weather data from Open-Meteo API
const fetchWeather = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`,
    );
    const data = await response.json();
    return data.current_weather;
  } catch (error) {
    console.error("Failed to fetch weather:", error);
    return null;
  }
};

export default function LocationScreen() {
  // UI State
  const [loading, setLoading] = useState(true);

  // Current user's state
  const [myLocation, setMyLocation] = useState(null);
  const [myWeather, setMyWeather] = useState(null);

  // Partner's state
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [partnerWeather, setPartnerWeather] = useState(null);

  // Computed state
  const [distance, setDistance] = useState(null);
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    let unsubscribePartner;
    let cancelled = false;

    const initializeData = async () => {
      if (!currentUserId) return;

      try {
        // 1. Fetch current user data to verify pairing status and get partner ID
        const userRef = doc(db, "users", currentUserId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists() || !userSnap.data().pairedWith) {
          Alert.alert("Not Paired", "You need to pair with an account first.");
          setLoading(false);
          return;
        }

        const partnerId = userSnap.data().pairedWith;

        // Start the partner listener immediately, independent of my GPS
        unsubscribePartner = onSnapshot(doc(db, "users", partnerId), (snap) => {
          const loc = snap.data()?.location;
          if (loc) setPartnerLocation(loc);
        });

        // 2. Request native device location permissions
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Allow location access to use this feature.",
          );
          setLoading(false);
          return;
        }

        // 3. Retrieve current device coordinates
        let location = await Location.getLastKnownPositionAsync();
        if (!location) {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }
        if (cancelled) return;

        const myCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setMyLocation(myCoords);
        setLoading(false);

        // 4. Fetch local weather and sync current location to Firestore
        fetchWeather(myCoords.latitude, myCoords.longitude).then(setMyWeather);
        updateDoc(userRef, { location: myCoords }).catch(console.error);
      } catch (error) {
        console.error("Initialization error:", error);
        Alert.alert("Error", "Could not load location data.");
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    // Cleanup function to detach Firestore listener when component unmounts
    return () => {
      if (unsubscribePartner) unsubscribePartner();
    };
  }, [currentUserId]);

  /// MOVED PARTNER
  // Distance: derived from state, so it's always current
  useEffect(() => {
    if (myLocation && partnerLocation) {
      setDistance(
        calculateDistance(
          myLocation.latitude,
          myLocation.longitude,
          partnerLocation.latitude,
          partnerLocation.longitude,
        ),
      );
    }
  }, [myLocation, partnerLocation]);

  //Framing markers to fit both locations on map
  const mapRef = useRef();
  useEffect(() => {
    if (mapRef.current && myLocation && partnerLocation) {
      mapRef.current.fitToCoordinates([myLocation, partnerLocation], {
        edgePadding: { top: 350, right: 100, bottom: 100, left: 100 },
        animated: true,
      });
    }
  }, [myLocation, partnerLocation]);

  // Partner weather: only refetch when their coordinates actually change
  useEffect(() => {
    if (!partnerLocation) return;
    fetchWeather(partnerLocation.latitude, partnerLocation.longitude).then(
      setPartnerWeather,
    );
  }, [partnerLocation?.latitude, partnerLocation?.longitude]);

  // Render loading screen while initial location/pairing check finishes
  if (loading || !myLocation) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Locating you and your partner...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Floating Information Overlay */}
      <View style={styles.infoCard}>
        <View style={styles.weatherRow}>
          {/* Current User Weather Block */}
          <View style={styles.weatherBlock}>
            <Text style={styles.label}>Your Weather</Text>
            <Text style={styles.condition}>
              {myWeather ? getWeatherCondition(myWeather.weathercode) : "--"}
            </Text>
            <Text style={styles.temperature}>
              {myWeather ? `${myWeather.temperature}°F` : "--"}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Partner Weather Block */}
          <View style={styles.weatherBlock}>
            <Text style={styles.label}>Partner's Weather</Text>
            <Text style={styles.condition}>
              {partnerWeather
                ? getWeatherCondition(partnerWeather.weathercode)
                : "--"}
            </Text>
            <Text style={styles.temperature}>
              {partnerWeather ? `${partnerWeather.temperature}°F` : "--"}
            </Text>
          </View>
        </View>

        {/* Distance Indicator */}
        {distance && (
          <Text style={styles.distanceText}>
            You are <Text style={styles.boldText}>{distance}km</Text> apart
          </Text>
        )}
      </View>

      {/* Interactive Map Component */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: myLocation.latitude,
          longitude: myLocation.longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
      >
        {/* Current User Pin */}
        <Marker
          coordinate={myLocation}
          title="You"
          description={
            myWeather ? `${myWeather.temperature}°F` : "Your location"
          }
          pinColor="red"
        />

        {/* Partner Pin */}
        {partnerLocation && (
          <Marker
            coordinate={partnerLocation}
            title="Partner"
            description={
              partnerWeather
                ? `${partnerWeather.temperature}°F`
                : "Partner's location"
            }
            pinColor="blue"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  map: {
    flex: 1,
  },
  infoCard: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    zIndex: 1, // Ensures the card renders above the MapView
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5, // Android drop shadow support
  },
  weatherRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  weatherBlock: {
    alignItems: "center",
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: "#ddd",
    marginHorizontal: 10,
  },
  label: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 5,
  },
  temperature: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  condition: {
    fontSize: 28,
    color: "#555",
    marginTop: 5,
    fontWeight: "500",
  },
  distanceText: {
    textAlign: "center",
    fontSize: 16,
    color: "#444",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  boldText: {
    fontWeight: "bold",
    color: "#007BFF",
  },
});
