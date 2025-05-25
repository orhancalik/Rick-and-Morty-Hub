import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { LightThemeColors, DarkThemeColors } from "../theme/colors";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Character = {
  id: number;
  name: string;
  status: string;
  species: string;
  type?: string;
  gender?: string;
  origin?: {
    name: string;
    url?: string;
  };
  location?: {
    name: string;
    url?: string;
  };
  image: string;
  episode?: string[];
  url?: string;
  created?: string;
};

const LAST_UPDATED_KEY = "characterOfTheDayUpdated";

export default function CharacterOfTheDay() {
  const { theme } = useTheme();
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAndUpdateCharacter();
  }, []);

  const checkAndUpdateCharacter = async () => {
    try {
      const lastUpdated = await AsyncStorage.getItem(LAST_UPDATED_KEY);
      const now = new Date();
      const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime();

      if (!lastUpdated || parseInt(lastUpdated) < today) {
        // Time to update the character of the day
        fetchRandomCharacter();
        await AsyncStorage.setItem(LAST_UPDATED_KEY, today.toString());
      } else {
        // Use existing character
        const savedCharacter = await AsyncStorage.getItem("characterOfTheDay");
        if (savedCharacter) {
          setCharacter(JSON.parse(savedCharacter));
        } else {
          fetchRandomCharacter();
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error checking character of the day:", error);
      setLoading(false);
    }
  };

  const fetchRandomCharacter = async () => {
    try {
      // Get a random character between 1 and 826 (total characters in API)
      const id = Math.floor(Math.random() * 826) + 1;

      console.log(`Fetching character with ID: ${id}`);

      const response = await fetch(
        `https://sampleapis.assimilate.be/rickmorty/characters/${id}`
      );

      if (!response.ok) {
        throw new Error(`API response error: ${response.status}`);
      }

      const responseText = await response.text(); // Eerst text ophalen

      try {
        const data = JSON.parse(responseText);

        // Valideren dat we een geldig karakter hebben
        if (!data || !data.name || !data.image) {
          throw new Error("Invalid character data");
        }

        setCharacter(data);
        await AsyncStorage.setItem("characterOfTheDay", JSON.stringify(data));
      } catch (parseError) {
        console.error("JSON Parse error:", parseError);
        console.error("Response text:", responseText);

        // Als fallback, probeer een ander karakter
        const fallbackId = Math.floor(Math.random() * 826) + 1;
        if (fallbackId !== id) {
          console.log(`Retrying with fallback ID: ${fallbackId}`);
          const fallbackResponse = await fetch(
            `https://sampleapis.assimilate.be/rickmorty/characters/${fallbackId}`
          );
          const fallbackData = await fallbackResponse.json();
          setCharacter(fallbackData);
          await AsyncStorage.setItem(
            "characterOfTheDay",
            JSON.stringify(fallbackData)
          );
        } else {
          // Gebruik een hardcoded fallback karakter als alles mislukt
          const fallbackCharacter: Character = {
            id: 1,
            name: "Rick Sanchez",
            status: "Alive",
            species: "Human",
            location: {
              name: "Earth (Replacement Dimension)",
              url: "https://rickandmortyapi.com/api/location/20",
            },
            image: "https://rickandmortyapi.com/api/character/avatar/1.jpeg",
          };
          setCharacter(fallbackCharacter);
          await AsyncStorage.setItem(
            "characterOfTheDay",
            JSON.stringify(fallbackCharacter)
          );
        }
      }
    } catch (error) {
      console.error("Error fetching character:", error);

      const defaultCharacter: Character = {
        id: 1,
        name: "Rick Sanchez",
        status: "Alive",
        species: "Human",
        location: {
          name: "Earth (Replacement Dimension)",
          url: "https://rickandmortyapi.com/api/location/20",
        },
        image: "https://rickandmortyapi.com/api/character/avatar/1.jpeg",
      };

      setCharacter(defaultCharacter);

      try {
        await AsyncStorage.setItem(
          "characterOfTheDay",
          JSON.stringify(defaultCharacter)
        );
      } catch (storageError) {
        console.error("AsyncStorage error:", storageError);
      }
    }
  };

  if (loading || !character) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={() =>
        navigation.navigate("CharacterDetail" as any, { character } as any)
      }
    >
      <Text style={[styles.title, { color: colors.highlight }]}>
        Character of the Day
      </Text>
      <View style={styles.content}>
        <Image source={{ uri: character.image }} style={styles.image} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>
            {character.name}
          </Text>
          <Text style={[styles.species, { color: colors.accent }]}>
            {character.species} - {character.status}
          </Text>
          <Text style={[styles.location, { color: colors.accent }]}>
            Last seen: {character.location?.name || "Unknown"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  content: {
    flexDirection: "row",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  info: {
    marginLeft: 12,
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  species: {
    fontSize: 14,
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
  },
});
