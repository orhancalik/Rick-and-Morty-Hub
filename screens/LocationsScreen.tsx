import React, { useEffect, useState } from "react";
import { View, FlatList, Text, StyleSheet } from "react-native";
import { Location } from "../types";
import { useTheme } from "../theme/ThemeContext";
import { LightThemeColors, DarkThemeColors } from "../theme/colors";
import { SafeAreaView } from "react-native-safe-area-context";
export default function LocationsScreen() {
  const [locations, setLocations] = useState<Location[]>([]);

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
