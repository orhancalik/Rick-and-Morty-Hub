import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  Image,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../theme/ThemeContext";
import { LightThemeColors, DarkThemeColors } from "../theme/colors";
import { Character } from "../types";
import { SafeAreaView } from "react-native-safe-area-context";

const PROFILE_KEY = "profilePhoto";

export default function ProfileScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Character[]>([]);
  const { theme } = useTheme();
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(PROFILE_KEY);
      if (stored) setImage(stored);
      const favs = await AsyncStorage.getItem("favorites");
      setFavorites(favs ? JSON.parse(favs) : []);
    })();
  }, []);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!res.canceled && res.assets.length > 0) {
      setImage(res.assets[0].uri);
      await AsyncStorage.setItem(PROFILE_KEY, res.assets[0].uri);
      Alert.alert("Gelukt", "Profielfoto opgeslagen!");
    }
  };

  const removePhoto = async () => {
    setImage(null);
    await AsyncStorage.removeItem(PROFILE_KEY);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-start",
      backgroundColor: colors.background,
      paddingTop: 30,
    },
    heading: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.highlight,
      marginBottom: 20,
    },
    avatar: {
      width: 150,
      height: 150,
      borderRadius: 99,
      marginBottom: 24,
      borderWidth: 4,
      borderColor: colors.highlight,
    },
    favTitle: {
      marginTop: 36,
      marginBottom: 12,
      fontSize: 20,
      color: colors.highlight,
      fontWeight: "bold",
      alignSelf: "flex-start",
      marginLeft: 18,
    },
    favItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      marginVertical: 7,
      borderRadius: 11,
      marginHorizontal: 10,
    },
    favAvatar: {
      width: 42,
      height: 42,
      borderRadius: 40,
      margin: 9,
      borderWidth: 2,
      borderColor: colors.accent,
    },
    favName: { color: colors.text, fontSize: 19 },
    leeg: {
      color: colors.accent,
      fontSize: 16,
      textAlign: "center",
      marginTop: 16,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Jouw Profielfoto</Text>
      <Image
        source={
          image ? { uri: image } : require("../assets/profile-placeholder.png")
        }
        style={styles.avatar}
      />
      <Button
        title="Kies een foto"
        onPress={pickImage}
        color={colors.highlight}
      />
      {image && (
        <Button
          title="Verwijder foto"
          onPress={removePhoto}
          color={colors.accent}
        />
      )}

      <Text style={styles.favTitle}>Favorieten</Text>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.favItem}>
            <Image source={{ uri: item.image }} style={styles.favAvatar} />
            <Text style={styles.favName}>{item.name}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.leeg}>Geen favorieten gevonden.</Text>
        }
      />
    </SafeAreaView>
  );
}
