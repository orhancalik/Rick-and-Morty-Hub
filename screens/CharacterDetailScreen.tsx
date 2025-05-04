import React, { useState } from "react";
import {
  View,
  Image,
  Text,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../App";
import { Character } from "../types";
import * as Notifications from "expo-notifications";
import ConfettiCannon from "react-native-confetti-cannon";
import { useTheme } from "../theme/ThemeContext";
import { LightThemeColors, DarkThemeColors } from "../theme/colors";
import { SafeAreaView } from "react-native-safe-area-context";
type DetailProps = {
  route: RouteProp<RootStackParamList, "CharacterDetail">;
};

export default function CharacterDetailScreen({ route }: DetailProps) {
  const character = route.params.character;
  const [showConfetti, setShowConfetti] = useState(false);
  const navigation = useNavigation();

  const { theme } = useTheme();
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;

  const saveFavorite = async () => {
    let favs = await AsyncStorage.getItem("favorites");
    let favsParsed: Character[] = favs ? JSON.parse(favs) : [];
    if (!favsParsed.find((f) => f.id === character.id)) {
      favsParsed.push(character);
      await AsyncStorage.setItem("favorites", JSON.stringify(favsParsed));
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Nieuw favoriet toegevoegd!",
          body: `Je hebt ${character.name} als favoriet opgeslagen.`,
          sound: true,
        },
        trigger: null,
      });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      Alert.alert("Gelukt", "Favoriet opgeslagen!");
    } else {
      Alert.alert("Let op", "Deze favoriet bestaat al.");
    }
  };

  const styles = StyleSheet.create({
    detailContainer: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      padding: 20,
    },
    customHeader: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "stretch",
      marginTop: 8,
      marginBottom: 16,
      paddingLeft: 4,
    },
    backIcon: {
      padding: 6,
    },
    headerText: {
      fontSize: 24,
      color: colors.text,
      fontWeight: "bold",
      marginLeft: 8,
    },
    detailImg: {
      width: 180,
      height: 180,
      borderRadius: 99,
      margin: 14,
      borderWidth: 5,
      borderColor: colors.highlight,
    },
    detailName: {
      fontSize: 33,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 6,
    },
    detailSub: { color: colors.highlight, fontSize: 18, marginBottom: 10 },
    detailItem: { color: colors.accent, fontSize: 15, marginBottom: 7 },
  });

  return (
    <SafeAreaView style={styles.detailContainer}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backIcon}
          accessibilityLabel="Terug"
        >
          <Ionicons name="arrow-back" size={30} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Character Details</Text>
      </View>
      {/* Content */}
      <Image source={{ uri: character.image }} style={styles.detailImg} />
      <Text style={styles.detailName}>{character.name}</Text>
      <Text style={styles.detailSub}>
        {character.species} - {character.status}
      </Text>
      <Text style={styles.detailItem}>Origin: {character.origin}</Text>
      <Text style={styles.detailItem}>Gender: {character.gender}</Text>
      <Button
        title="Toevoegen aan favorieten"
        color={colors.highlight}
        onPress={saveFavorite}
      />
      {showConfetti && (
        <ConfettiCannon
          count={120}
          origin={{ x: 180, y: -20 }}
          fadeOut
          explosionSpeed={350}
          fallSpeed={2500}
        />
      )}
    </SafeAreaView>
  );
}
