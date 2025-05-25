import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Audio } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PortalScreen() {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const portalScale = useRef(new Animated.Value(1)).current;
  const portalOpacity = useRef(new Animated.Value(1)).current;

  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/portal_sound.mp3")
    );
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded || status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  }

  function portalNavigateTo(tabKey: string) {
    // @ts-ignore - want types kunnen hier klagen door nested navigators
    navigation.navigate("Explore", { screen: tabKey });
  }

  async function openPortal() {
    setLoading(true);
    await playSound();

    Animated.parallel([
      Animated.timing(portalScale, {
        toValue: 1.5,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(portalOpacity, {
        toValue: 0.7,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const ACHIEVEMENTS_KEY = "userAchievements";
      const achievements = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      if (achievements) {
        const achievementsData = JSON.parse(achievements);
        achievementsData.portalUses += 1;
        await AsyncStorage.setItem(
          ACHIEVEMENTS_KEY,
          JSON.stringify(achievementsData)
        );
      }
    } catch (error) {
      console.error("Error updating portal uses achievement:", error);
    }

    setTimeout(() => {
      const tabs = ["Characters", "Episodes", "Locations"];
      const randomTab = tabs[Math.floor(Math.random() * tabs.length)];
      portalNavigateTo(randomTab);
      setLoading(false);

      portalScale.setValue(1);
      portalOpacity.setValue(1);
    }, 1500);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portal Time!</Text>
      <Animated.View
        style={{
          transform: [{ scale: portalScale }],
          opacity: portalOpacity,
        }}
      >
        <Image
          source={require("../assets/portal.gif")}
          style={styles.gif}
          resizeMode="contain"
        />
      </Animated.View>
      <TouchableOpacity
        style={styles.button}
        onPress={openPortal}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Teleport</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator color="#80ff72" size="large" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#232950",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#80ff72", fontSize: 34, fontWeight: "bold", margin: 16 },
  gif: { width: 220, height: 220, margin: 36 },
  button: {
    backgroundColor: "#80ff72",
    padding: 16,
    borderRadius: 80,
    marginTop: 30,
  },
  buttonText: { color: "#232950", fontWeight: "bold", fontSize: 19 },
});
