import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Location } from "../types";
import { useTheme } from "../theme/ThemeContext";
import { LightThemeColors, DarkThemeColors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function LocationsScreen() {
  const [locations, setLocations] = useState<Location[]>([]);
  const navigation = useNavigation();
  const { theme } = useTheme();
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;

  useEffect(() => {
    fetch("https://sampleapis.assimilate.be/rickandmorty/locations")
      .then((res) => res.json())
      .then(setLocations);
  }, []);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 15 },
    title: {
      fontSize: 26,
      color: colors.highlight,
      fontWeight: "bold",
      marginBottom: 14,
    },
    mapButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.highlight,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    mapButtonText: {
      color: "#fff",
      fontWeight: "bold",
      marginLeft: 8,
      fontSize: 16,
    },
    item: {
      backgroundColor: colors.card,
      marginVertical: 5,
      padding: 10,
      borderRadius: 9,
    },
    locName: { color: colors.text, fontSize: 18 },
    locInfo: { color: colors.accent, fontSize: 13 },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Locations</Text>

      <TouchableOpacity
        style={styles.mapButton}
        onPress={() => navigation.navigate("LocationMap" as never)}
      >
        <Ionicons name="map-outline" size={24} color="#fff" />
        <Text style={styles.mapButtonText}>Explore Locations</Text>
      </TouchableOpacity>

      <FlatList
        data={locations}
        keyExtractor={(l) => l.id?.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.locName}>{item.name}</Text>
            <Text style={styles.locInfo}>
              {item.type} - {item.dimension}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
