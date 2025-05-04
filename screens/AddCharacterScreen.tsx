import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Character } from "../types";
import { useTheme } from "../theme/ThemeContext";
import { LightThemeColors, DarkThemeColors } from "../theme/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function AddCharacterScreen() {
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const { theme } = useTheme();
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;
  const navigation = useNavigation();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const saveCharacter = async () => {
    if (!name || !origin || !image) {
      alert("Vul alle velden in!");
      return;
    }
    const char: Character = {
      id: Date.now(),
      name,
      status: "unknown",
      species: "unknown",
      type: "custom",
      gender: "unknown",
      origin,
      image,
    };
    let favs = await AsyncStorage.getItem("favorites");
    let favsParsed: Character[] = favs ? JSON.parse(favs) : [];
    favsParsed.push(char);
    await AsyncStorage.setItem("favorites", JSON.stringify(favsParsed));
    alert("Karakter opgeslagen in favorieten 🥳");
    navigation.goBack();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      padding: 23,
    },
    label: {
      color: colors.highlight,
      marginTop: 20,
      fontWeight: "bold",
      fontSize: 15,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 10,
      marginVertical: 10,
      minWidth: 222,
      color: colors.text,
    },
    img: {
      width: 110,
      height: 110,
      borderRadius: 55,
      margin: 13,
      borderWidth: 2,
      borderColor: colors.accent,
    },
    headerRow: {
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    headerText: {
      fontSize: 24,
      color: colors.text,
      marginLeft: 8,
      fontWeight: "bold",
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 6 }}
        >
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Nieuw Karakter</Text>
      </View>
      <Text style={styles.label}>Naam</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholder="Naam..."
        placeholderTextColor={colors.accent}
      />
      <Text style={styles.label}>Origin</Text>
      <TextInput
        value={origin}
        onChangeText={setOrigin}
        style={styles.input}
        placeholder="Origin..."
        placeholderTextColor={colors.accent}
      />
      <Button
        title="Kies afbeelding"
        color={colors.highlight}
        onPress={pickImage}
      />
      {image && <Image source={{ uri: image }} style={styles.img} />}
      <Button
        title="Sla op als favoriet"
        color={colors.accent}
        onPress={saveCharacter}
      />
    </SafeAreaView>
  );
}
