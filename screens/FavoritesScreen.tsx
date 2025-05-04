import React, { useEffect, useState } from "react";
import { View, FlatList, Text, Image, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Character } from "../types";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";
import { LightThemeColors, DarkThemeColors } from "../theme/colors";

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Character[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const navigation = useNavigation();

  const { theme } = useTheme();
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;

  useEffect(() => {
    const fetchData = async () => {
      const favs = await AsyncStorage.getItem("favorites");
      setFavorites(favs ? JSON.parse(favs) : []);
      const uri = await AsyncStorage.getItem("profilePhoto");
      setProfilePhoto(uri);
    };
    fetchData();

    const unsubscribe = navigation.addListener("focus", fetchData);
    return unsubscribe;
  }, [navigation]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 20 },
    title: {
      fontSize: 28,
      color: colors.highlight,
      fontWeight: "bold",
      marginBottom: 10,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      marginVertical: 7,
      borderRadius: 11,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 40,
      margin: 9,
      borderWidth: 2,
      borderColor: colors.accent,
    },
    name: { color: colors.text, fontSize: 19 },
    leeg: {
      color: colors.accent,
      fontSize: 16,
      textAlign: "center",
      marginTop: 44,
    },
    headText: { color: colors.highlight, fontWeight: "bold", fontSize: 18 },
    head: { alignItems: "center", marginVertical: 16 },
    headAvatar: {
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 4,
      borderColor: colors.highlight,
      marginBottom: 7,
    },
  });

  return (
    <View style={styles.container}>
      {/* HEAD: Profielfoto */}
      <View style={styles.head}>
        <Image
          source={
            profilePhoto
              ? { uri: profilePhoto }
              : require("../assets/profile-placeholder.png")
          }
          style={styles.headAvatar}
        />
        <Text style={styles.headText}>Mijn profielfoto</Text>
      </View>
      {/* Lijst met favoriete karakters */}
      <Text style={styles.title}>Favorieten</Text>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image source={{ uri: item.image }} style={styles.avatar} />
            <Text style={styles.name}>{item.name}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.leeg}>Geen favorieten gevonden.</Text>
        }
      />
    </View>
  );
}
