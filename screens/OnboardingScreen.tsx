import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { DarkThemeColors, LightThemeColors } from "../theme/colors";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

type OnboardingScreenProps = {
  onDone: () => void;
};

const slides = [
  {
    id: "1",
    title: "Welkom bij Rick & Morty Explorer",
    text: "Je ultieme gids door het multiverse!",
  },
  {
    id: "2",
    title: "Ontdek Personages & Locaties",
    text: "Bekijk honderden personages en locaties uit de show",
  },
  {
    id: "3",
    title: "Volg je Statistieken",
    text: "Verdien XP, badges en volg je voortgang",
  },
  {
    id: "4",
    title: "Start je Avontuur",
    text: "Portal naar willekeurige delen van de app en test je kennis",
  },
];

export default function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const { theme } = useTheme();
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0]?.index || 0);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");
      onDone();
    } catch (error) {
      console.log("Error saving onboarding status:", error);
      onDone();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <View style={styles.skipContainer}>
        {currentIndex < slides.length - 1 && (
          <TouchableOpacity
            onPress={completeOnboarding}
            style={styles.skipButton}
          >
            <Text style={[styles.skipText, { color: colors.accent }]}>
              Overslaan
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.slidesContainer}>
        <FlatList
          data={slides}
          renderItem={({ item, index }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.imageContainer}>
                <View
                  style={[
                    styles.iconBackground,
                    { backgroundColor: colors.highlight + "15" },
                  ]}
                >
                  <Ionicons
                    name={
                      index === 0
                        ? "flask-outline"
                        : index === 1
                        ? "people-outline"
                        : index === 2
                        ? "ribbon-outline"
                        : "planet-outline"
                    }
                    size={100}
                    color={colors.highlight}
                  />
                </View>
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.highlight }]}>
                  {item.title}
                </Text>
                <Text style={[styles.text, { color: colors.text }]}>
                  {item.text}
                </Text>
              </View>
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => {
            const opacity = scrollX.interpolate({
              inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ],
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });

            const scale = scrollX.interpolate({
              inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ],
              outputRange: [0.8, 1.2, 0.8],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={index.toString()}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: colors.highlight,
                    opacity,
                    transform: [{ scale }],
                  },
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.highlight }]}
          onPress={scrollTo}
        >
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? "Aan de slag" : "Volgende"}
          </Text>
          <Ionicons
            name={
              currentIndex === slides.length - 1 ? "checkmark" : "arrow-forward"
            }
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  skipContainer: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 50, // Voor de statusbalk
    alignItems: "flex-end",
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconBackground: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    width: 120,
    height: 120,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  bottomContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 50,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  indicator: {
    height: 10,
    width: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    width: 160,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 8,
  },
});
