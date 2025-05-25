import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import CharactersScreen from "./CharactersScreen";
import EpisodesScreen from "./EpisodesScreen";
import LocationsScreen from "./LocationsScreen";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { DarkThemeColors, LightThemeColors } from "../theme/colors";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";

const ExploreTab = createMaterialTopTabNavigator();

type ExploreScreenProps = {
  navigation: StackNavigationProp<RootStackParamList>;
};

export default function ExploreScreen({ navigation }: ExploreScreenProps) {
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

const styles = StyleSheet.create({
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    margin: 10,
  },
  mapButtonText: {
    color: "#fff",
    marginLeft: 5,
    fontSize: 16,
  },
});
