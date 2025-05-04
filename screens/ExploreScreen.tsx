import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import CharactersScreen from "./CharactersScreen";
import EpisodesScreen from "./EpisodesScreen";
import LocationsScreen from "./LocationsScreen";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { DarkThemeColors, LightThemeColors } from "../theme/colors";
const ExploreTab = createMaterialTopTabNavigator();

export default function ExploreScreen() {
  const { theme } = useTheme();
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ExploreTab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: colors.background },
          tabBarIndicatorStyle: { backgroundColor: colors.highlight },
          tabBarActiveTintColor: colors.highlight,
          tabBarInactiveTintColor: colors.text,
        }}
      >
        <ExploreTab.Screen name="Characters" component={CharactersScreen} />
        <ExploreTab.Screen name="Episodes" component={EpisodesScreen} />
        <ExploreTab.Screen name="Locations" component={LocationsScreen} />
      </ExploreTab.Navigator>
    </SafeAreaView>
  );
}
