import React, { useEffect, useState } from "react";
import { View, FlatList, Text, StyleSheet } from "react-native";
import { Episode } from "../types";
import { useTheme } from "../theme/ThemeContext";
import { LightThemeColors, DarkThemeColors } from "../theme/colors";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EpisodesScreen() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  const { theme } = useTheme();
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;

  useEffect(() => {
    fetch("https://sampleapis.assimilate.be/rickandmorty/episodes")
      .then((res) => res.json())
      .then(setEpisodes);
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
      padding: 12,
      borderRadius: 9,
    },
    epName: { color: colors.text, fontSize: 18 },
    epInfo: { color: colors.accent, fontSize: 13 },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Episodes</Text>
      <FlatList
        data={episodes}
        keyExtractor={(ep) => ep.id?.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.epName}>{item.name}</Text>
            <Text style={styles.epInfo}>
              S{item.season}E{item.episode} - {item.air_date}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
