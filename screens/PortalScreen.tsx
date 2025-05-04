import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import { useNavigation } from "@react-navigation/native";

export default function PortalScreen() {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

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

  // Nested navigate naar Explore/Characters/Episodes/Locations
  function portalNavigateTo(tabKey: string) {
    // @ts-ignore - want types kunnen hier klagen door nested navigators
    navigation.navigate("Explore", { screen: tabKey });
  }

  async function openPortal() {
    setLoading(true);
    await playSound();

    setTimeout(() => {
      const tabs = ["Characters", "Episodes", "Locations"];
      const randomTab = tabs[Math.floor(Math.random() * tabs.length)];
      portalNavigateTo(randomTab);
      setLoading(false);
    }, 1500);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portal Time!</Text>
      <Image
        source={require("../assets/portal.gif")}
        style={styles.gif}
        resizeMode="contain"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={openPortal}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Open Portal</Text>
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
