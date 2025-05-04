import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Button,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";
import { Character } from "../types";
import { Ionicons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import { useTheme } from "../theme/ThemeContext";
import { LightThemeColors, DarkThemeColors } from "../theme/colors";
import { SafeAreaView } from "react-native-safe-area-context";

type Navigation = StackNavigationProp<RootStackParamList>;

export default function CharactersScreen() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;
  const navigation = useNavigation<Navigation>();

  const fetchCharacters = useCallback(async () => {
    try {
      const res = await fetch(
        "https://sampleapis.assimilate.be/rickandmorty/characters"
      );
      const data = await res.json();
      setCharacters(data);
    } catch (err) {
      console.warn("Kan karakters niet ophalen", err);
    }
  }, []);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCharacters();
    setRefreshing(false);
  };

  const filtered = characters.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Dynamische styles gebaseerd op het actieve theme
  const dynamicStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 14 },
    title: {
      fontSize: 29,
      fontWeight: "bold",
      letterSpacing: 1,
      color: colors.highlight,
      marginVertical: 12,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 10,
      color: colors.text,
      fontSize: 18,
      padding: 10,
      marginBottom: 10,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      marginVertical: 7,
      borderRadius: 11,
      padding: 7,
    },
    avatar: {
      width: 66,
      height: 66,
      borderRadius: 40,
      margin: 10,
      borderWidth: 2,
      borderColor: colors.accent,
    },
    name: { color: colors.text, fontSize: 19, fontWeight: "bold" },
    sub: { color: colors.highlight, fontSize: 14 },
    addBtn: { position: "absolute", bottom: 24, right: 24 },
    themeToggle: {
      position: "absolute",
      top: 6,
      right: 16,
      backgroundColor: colors.card,
      borderRadius: 20,
      paddingHorizontal: 13,
      paddingVertical: 8,
      zIndex: 30,
    },
    themeToggleText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "bold",
    },
  });

  return (
    <View style={dynamicStyles.container}>
      {/* Theme schakelaar-knop */}
      <TouchableOpacity style={dynamicStyles.themeToggle} onPress={toggleTheme}>
        <Text style={dynamicStyles.themeToggleText}>
          {theme === "dark" ? "Licht modus" : "Donker modus"}
        </Text>
      </TouchableOpacity>

      <Text style={dynamicStyles.title}>Characters</Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Zoek..."
        placeholderTextColor={colors.accent}
        style={dynamicStyles.input}
      />
      <FlatList
        data={filtered}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item, index }) => (
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={index * 60}
            useNativeDriver
          >
            <TouchableOpacity
              style={dynamicStyles.item}
              onPress={() =>
                navigation.navigate("CharacterDetail", { character: item })
              }
            >
              <Image
                source={{ uri: item.image }}
                style={dynamicStyles.avatar}
              />
              <View>
                <Text style={dynamicStyles.name}>{item.name}</Text>
                <Text style={dynamicStyles.sub}>
                  {item.species} ({item.status})
                </Text>
              </View>
            </TouchableOpacity>
          </Animatable.View>
        )}
      />
      <TouchableOpacity
        style={dynamicStyles.addBtn}
        onPress={() => navigation.navigate("AddCharacter")}
      >
        <Ionicons name="add-circle" color={colors.highlight} size={54} />
      </TouchableOpacity>
    </View>
  );
}
