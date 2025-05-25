import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { LightThemeColors, DarkThemeColors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const quotes = [
  { text: "Wubba Lubba Dub Dub!", character: "Rick Sanchez" },
  {
    text: "Nobody exists on purpose. Nobody belongs anywhere. Everybody's gonna die. Come watch TV?",
    character: "Morty Smith",
  },
  {
    text: "Sometimes science is more art than science, Morty. A lot of people don't get that.",
    character: "Rick Sanchez",
  },
  {
    text: "I'm sorry, but your opinion means very little to me.",
    character: "Rick Sanchez",
  },
  {
    text: "To live is to risk it all; otherwise you're just an inert chunk of randomly assembled molecules drifting wherever the universe blows you.",
    character: "Rick Sanchez",
  },
  {
    text: "Get your shit together, get it all together and put it in a backpack, all your shit, so it's together.",
    character: "Morty Smith",
  },
  { text: "Don't be trippin', dog. We got you.", character: "Rick Sanchez" },
  {
    text: "I'm a scientist; because I invent, transform, create, and destroy for a living, and when I don't like something about the world, I change it.",
    character: "Rick Sanchez",
  },
  {
    text: "Weddings are basically funerals with cake.",
    character: "Rick Sanchez",
  },
];

export default function QuoteOfTheDay() {
  const { theme } = useTheme();
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;
  const [quote, setQuote] = useState(quotes[0]);

  useEffect(() => {
    getRandomQuote();
  }, []);

  const getRandomQuote = async () => {
    try {
      const lastDate = await AsyncStorage.getItem("quoteLastUpdated");
      const today = new Date().toDateString();

      if (lastDate !== today) {
        // New day, new quote
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setQuote(randomQuote);
        await AsyncStorage.setItem("quoteLastUpdated", today);
        await AsyncStorage.setItem("currentQuote", JSON.stringify(randomQuote));
      } else {
        // Same day, use saved quote
        const savedQuote = await AsyncStorage.getItem("currentQuote");
        if (savedQuote) {
          setQuote(JSON.parse(savedQuote));
        }
      }
    } catch (error) {
      console.error("Error with quote of the day:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.quoteIconContainer}>
        <Ionicons
          name="chatbubble-outline"
          size={24}
          color={colors.highlight}
        />
      </View>
      <Text style={[styles.quoteText, { color: colors.text }]}>
        "{quote.text}"
      </Text>
      <Text style={[styles.character, { color: colors.accent }]}>
        — {quote.character}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 16,
  },
  quoteIconContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: "italic",
    marginBottom: 8,
    lineHeight: 22,
  },
  character: {
    fontSize: 14,
    textAlign: "right",
  },
});
