import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, ActivityIndicator } from "react-native";
import CharactersScreen from "./screens/CharactersScreen";
import CharacterDetailScreen from "./screens/CharacterDetailScreen";
import EpisodesScreen from "./screens/EpisodesScreen";
import LocationsScreen from "./screens/LocationsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AddCharacterScreen from "./screens/AddCharacterScreen";
import PortalScreen from "./screens/PortalScreen";
import ExploreScreen from "./screens/ExploreScreen";
import QuizScreen from "./screens/QuizScreen";
import LocationMapScreen from "./screens/LocationMapScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import { Image } from "react-native";
import ThemeProvider, { useTheme } from "./theme/ThemeContext";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Character } from "./types";
import { DarkThemeColors, LightThemeColors } from "./theme/colors";

export type RootStackParamList = {
  Tabs: undefined;
  CharacterDetail: { character: Character };
  AddCharacter: undefined;
  LocationMap: undefined;
};

const Tab = createBottomTabNavigator();
const MainStack = createStackNavigator<RootStackParamList>();

// Loading screen component
function SplashScreen() {
  const { theme } = useTheme();
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <Image
        source={require("./assets/splash-logo.png")}
        style={{ width: 200, height: 200, marginBottom: 20 }}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={colors.highlight} />
    </View>
  );
}

function ProfileTabIcon({ color, size }: { color: string; size: number }) {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => {
    AsyncStorage.getItem("profilePhoto").then((uri) => {
      if (uri) setImage(uri);
    });
  }, []);
  if (image) {
    return (
      <Image
        source={{ uri: image }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          borderWidth: 2,
        }}
      />
    );
  } else {
    return (
      <Image
        source={require("./assets/profile-placeholder.png")}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          borderWidth: 2,
        }}
      />
    );
  }
}

// Hieronder je dynamische tab navigator met kleuren uit je eigen ThemeContext!
function YourTabNavigator() {
  const { theme } = useTheme(); // <-- Je eigen useTheme!
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: colors.background,
          height: 64,
        },
        tabBarActiveTintColor: colors.highlight,
        tabBarInactiveTintColor: colors.text,
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Explore")
            return <Ionicons name="search" color={color} size={size} />;
          else if (route.name === "Quiz")
            return <Ionicons name="school" color={color} size={size} />;
          else if (route.name === "Portal")
            return <Ionicons name="planet" color={color} size={size} />;
          else if (route.name === "Profile")
            return <ProfileTabIcon color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Quiz"
        component={QuizScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Portal"
        component={PortalScreen}
        options={{ tabBarLabel: "Portal" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

// Je AppContent component die alleen de app toont
function AppContent() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const hasCompletedOnboarding = await AsyncStorage.getItem(
          "hasCompletedOnboarding"
        );
        // Als de user de onboarding nog niet heeft gezien, toon deze dan
        setShowOnboarding(hasCompletedOnboarding !== "true");
        setLoading(false);
      } catch (error) {
        console.log("Error checking onboarding status:", error);
        setShowOnboarding(false);
        setLoading(false);
      }
    };

    checkOnboarding();
  }, []);

  // Request notification permission
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  if (showOnboarding) {
    return <OnboardingScreen onDone={() => setShowOnboarding(false)} />;
  }

  return (
    <NavigationContainer>
      <MainStack.Navigator screenOptions={{ headerShown: false }}>
        <MainStack.Screen name="Tabs" component={YourTabNavigator} />
        <MainStack.Screen
          name="CharacterDetail"
          component={CharacterDetailScreen}
        />
        <MainStack.Screen name="AddCharacter" component={AddCharacterScreen} />
        <MainStack.Screen name="LocationMap" component={LocationMapScreen} />
      </MainStack.Navigator>
    </NavigationContainer>
  );
}

// Je hoofdapp component
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
