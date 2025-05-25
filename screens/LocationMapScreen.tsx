import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { LightThemeColors, DarkThemeColors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";

const DISCOVERED_LOCATIONS_KEY = "discoveredLocations";
const ACHIEVEMENTS_KEY = "userAchievements";
const USER_LEVEL_KEY = "userLevelData";
const PORTAL_STYLES_KEY = "portalStyles";

type Location = {
  id: number;
  name: string;
  type: string;
  dimension: string;
  residents?: number[];
  image?: string;
  description?: string;
  hidden?: boolean;
  characterDropId?: number;
};

type MapRegion = {
  id: number;
  name: string;
  locations: Location[];
  image: any;
  unlocked: boolean;
  requiredRegionId?: number;
};

type CharacterDrop = {
  id: number;
  characterId: number;
  locationId: number;
  discovered: boolean;
};

type PortalStyle = {
  id: string;
  name: string;
  color: string;
  unlocked: boolean;
};

export default function LocationMapScreen() {
  const { theme } = useTheme();
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [regions, setRegions] = useState<MapRegion[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<MapRegion | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [discoveredLocations, setDiscoveredLocations] = useState<number[]>([]);
  const [discoveredCharacters, setDiscoveredCharacters] = useState<
    CharacterDrop[]
  >([]);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [discoveredCharacter, setDiscoveredCharacter] = useState<any>(null);
  const [portalStyles, setPortalStyles] = useState<PortalStyle[]>([]);

  const bounceAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    loadData();
    loadDiscoveredLocations();
    loadDiscoveredCharacters();
    loadPortalStyles();
  }, []);

  const loadData = async () => {
    try {
      const locationsResponse = await fetch(
        "https://sampleapis.assimilate.be/rickandmorty/locations"
      );
      const locationsData = await locationsResponse.json();
      setLocations(locationsData);

      const mapRegions: MapRegion[] = [
        {
          id: 1,
          name: "Earth Dimension C-137",
          locations: locationsData.filter(
            (loc: Location) =>
              loc.dimension === "Dimension C-137" ||
              loc.name.includes("Earth") ||
              loc.name.includes("Smith")
          ),
          image: {
            uri: "https://rickandmortyapi.com/api/character/avatar/1.jpeg",
          },
          unlocked: true,
        },
        {
          id: 2,
          name: "Citadel of Ricks",
          locations: locationsData.filter(
            (loc: Location) =>
              loc.name.includes("Citadel") || loc.name.includes("Rick")
          ),
          image: {
            uri: "https://rickandmortyapi.com/api/character/avatar/2.jpeg",
          },
          unlocked: false,
          requiredRegionId: 1,
        },
        {
          id: 3,
          name: "Alien Worlds",
          locations: locationsData.filter(
            (loc: Location) =>
              loc.type?.includes("Planet") || loc.type?.includes("Space")
          ),
          image: {
            uri: "https://rickandmortyapi.com/api/character/avatar/7.jpeg",
          },
          unlocked: false,
          requiredRegionId: 2,
        },
        {
          id: 4,
          name: "Interdimensional Spaces",
          locations: locationsData.filter(
            (loc: Location) =>
              loc.dimension !== "Dimension C-137" &&
              loc.dimension !== "unknown" &&
              !loc.name.includes("Earth")
          ),
          image: {
            uri: "https://rickandmortyapi.com/api/character/avatar/10.jpeg",
          },
          unlocked: false,
          requiredRegionId: 3,
        },
      ];

      setRegions(mapRegions);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading location data:", error);
      Alert.alert("Error", "Failed to load location data");
      setIsLoading(false);
    }
  };

  const loadDiscoveredLocations = async () => {
    try {
      const discovered = await AsyncStorage.getItem(DISCOVERED_LOCATIONS_KEY);
      if (discovered) {
        setDiscoveredLocations(JSON.parse(discovered));
      }
    } catch (error) {
      console.error("Error loading discovered locations:", error);
    }
  };

  const loadDiscoveredCharacters = async () => {
    try {
      const characters = await AsyncStorage.getItem("discoveredMapCharacters");
      if (characters) {
        setDiscoveredCharacters(JSON.parse(characters));
      } else {
        setDiscoveredCharacters([]);
        await AsyncStorage.setItem(
          "discoveredMapCharacters",
          JSON.stringify([])
        );
      }
    } catch (error) {
      console.error("Error loading discovered characters:", error);
    }
  };

  const loadPortalStyles = async () => {
    try {
      const styles = await AsyncStorage.getItem(PORTAL_STYLES_KEY);
      if (styles) {
        setPortalStyles(JSON.parse(styles));
      } else {
        const defaultStyles: PortalStyle[] = [
          {
            id: "green",
            name: "Green Portal",
            color: "#39FF14",
            unlocked: true,
          },
          {
            id: "blue",
            name: "Blue Portal",
            color: "#00BFFF",
            unlocked: false,
          },
          { id: "red", name: "Red Portal", color: "#FF3131", unlocked: false },
          {
            id: "purple",
            name: "Purple Portal",
            color: "#9370DB",
            unlocked: false,
          },
          {
            id: "gold",
            name: "Gold Portal",
            color: "#FFD700",
            unlocked: false,
          },
        ];
        setPortalStyles(defaultStyles);
        await AsyncStorage.setItem(
          PORTAL_STYLES_KEY,
          JSON.stringify(defaultStyles)
        );
      }
    } catch (error) {
      console.error("Error loading portal styles:", error);
    }
  };

  const selectRegion = (region: MapRegion) => {
    if (!region.unlocked) {
      const requiredRegion = regions.find(
        (r) => r.id === region.requiredRegionId
      );
      Alert.alert(
        "Region Locked",
        `You need to discover more locations in ${
          requiredRegion?.name || "previous regions"
        } first.`
      );
      return;
    }

    setSelectedRegion(region);
    setShowRegionModal(true);

    Animated.spring(bounceAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      bounceAnim.setValue(0);
    });
  };

  const selectLocation = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationModal(true);

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    if (!discoveredLocations.includes(location.id)) {
      const updatedDiscoveries = [...discoveredLocations, location.id];
      setDiscoveredLocations(updatedDiscoveries);
      saveDiscoveredLocations(updatedDiscoveries);

      checkRegionUnlock(updatedDiscoveries);

      checkForCharacterDrop(location);

      awardLocationDiscoveryXP();
    }
  };

  const saveDiscoveredLocations = async (locations: number[]) => {
    try {
      await AsyncStorage.setItem(
        DISCOVERED_LOCATIONS_KEY,
        JSON.stringify(locations)
      );

      // Update the locations discovered count in achievements
      const achievements = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      if (achievements) {
        const achievementsData = JSON.parse(achievements);
        achievementsData.locationsDiscovered = locations.length;
        await AsyncStorage.setItem(
          ACHIEVEMENTS_KEY,
          JSON.stringify(achievementsData)
        );
      }
    } catch (error) {
      console.error("Error saving discovered locations:", error);
    }
  };

  const checkRegionUnlock = (discoveredIds: number[]) => {
    const updatedRegions = regions.map((region) => {
      // A region is unlocked if:
      // 1. It was already unlocked, OR
      // 2. The required previous region is unlocked AND at least 50% of its locations are discovered

      if (region.unlocked) return region;

      if (region.requiredRegionId) {
        const requiredRegion = regions.find(
          (r) => r.id === region.requiredRegionId
        );
        if (!requiredRegion?.unlocked) return region;

        // Check if at least 50% of required region's locations are discovered
        const requiredRegionLocations = requiredRegion.locations;
        const discoveredInRequired = requiredRegionLocations.filter((loc) =>
          discoveredIds.includes(loc.id)
        ).length;

        const percentDiscovered =
          requiredRegionLocations.length > 0
            ? discoveredInRequired / requiredRegionLocations.length
            : 0;

        if (percentDiscovered >= 0.5) {
          // Unlock this region!
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          setTimeout(() => {
            Alert.alert(
              "New Region Unlocked!",
              `You've unlocked the ${region.name} region!`
            );
          }, 500);

          return { ...region, unlocked: true };
        }
      }

      return region;
    });

    setRegions(updatedRegions);
  };

  const checkForCharacterDrop = async (location: Location) => {
    // Chance-based character drops (30% chance)
    if (Math.random() < 0.3) {
      try {
        // Get a character from the API
        const response = await fetch(
          "https://sampleapis.assimilate.be/rickandmorty/characters"
        );
        const characters = await response.json();

        // Pick a random character
        const randomCharacter =
          characters[Math.floor(Math.random() * characters.length)];

        // Create a character drop record
        const newDrop: CharacterDrop = {
          id: Date.now(),
          characterId: randomCharacter.id,
          locationId: location.id,
          discovered: true,
        };

        // Save the drop
        const updatedDrops = [...discoveredCharacters, newDrop];
        setDiscoveredCharacters(updatedDrops);
        await AsyncStorage.setItem(
          "discoveredMapCharacters",
          JSON.stringify(updatedDrops)
        );

        // Show the character discovery modal
        setDiscoveredCharacter(randomCharacter);

        // Only show after the location modal is dismissed
        setTimeout(() => {
          setShowCharacterModal(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 500);

        // Award extra XP for character discovery
        awardCharacterDiscoveryXP();

        // Check portal styles unlock
        checkPortalStyleUnlock(updatedDrops.length);
      } catch (error) {
        console.error("Error with character drop:", error);
      }
    }
  };

  const awardLocationDiscoveryXP = async () => {
    try {
      const levelData = await AsyncStorage.getItem(USER_LEVEL_KEY);
      if (levelData) {
        const userLevel = JSON.parse(levelData);
        const xpAward = 10;
        userLevel.xp += xpAward;

        // Check for level up
        const levelThresholds = [
          0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700,
        ];

        while (
          userLevel.xp >= userLevel.nextLevelXp &&
          userLevel.level < levelThresholds.length - 1
        ) {
          userLevel.level += 1;
          userLevel.nextLevelXp = levelThresholds[userLevel.level];
        }

        await AsyncStorage.setItem(USER_LEVEL_KEY, JSON.stringify(userLevel));
      }
    } catch (error) {
      console.error("Error awarding XP:", error);
    }
  };

  const awardCharacterDiscoveryXP = async () => {
    try {
      const levelData = await AsyncStorage.getItem(USER_LEVEL_KEY);
      if (levelData) {
        const userLevel = JSON.parse(levelData);
        const xpAward = 25; // More XP for character discovery
        userLevel.xp += xpAward;

        // Check for level up
        const levelThresholds = [
          0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700,
        ];

        while (
          userLevel.xp >= userLevel.nextLevelXp &&
          userLevel.level < levelThresholds.length - 1
        ) {
          userLevel.level += 1;
          userLevel.nextLevelXp = levelThresholds[userLevel.level];
        }

        await AsyncStorage.setItem(USER_LEVEL_KEY, JSON.stringify(userLevel));
      }
    } catch (error) {
      console.error("Error awarding XP:", error);
    }
  };

  const checkPortalStyleUnlock = async (characterCount: number) => {
    // Unlock portal styles based on character discoveries
    const updatedStyles = [...portalStyles];
    let unlocked = false;

    if (
      characterCount >= 3 &&
      !portalStyles.find((s) => s.id === "blue")?.unlocked
    ) {
      // Unlock blue portal at 3 characters
      const bluePortalIndex = updatedStyles.findIndex((s) => s.id === "blue");
      if (bluePortalIndex !== -1) {
        updatedStyles[bluePortalIndex].unlocked = true;
        unlocked = true;

        setTimeout(() => {
          Alert.alert(
            "New Portal Style Unlocked!",
            "You've unlocked the Blue Portal style!"
          );
        }, 1000);
      }
    } else if (
      characterCount >= 7 &&
      !portalStyles.find((s) => s.id === "red")?.unlocked
    ) {
      // Unlock red portal at 7 characters
      const redPortalIndex = updatedStyles.findIndex((s) => s.id === "red");
      if (redPortalIndex !== -1) {
        updatedStyles[redPortalIndex].unlocked = true;
        unlocked = true;

        setTimeout(() => {
          Alert.alert(
            "New Portal Style Unlocked!",
            "You've unlocked the Red Portal style!"
          );
        }, 1000);
      }
    } else if (
      characterCount >= 12 &&
      !portalStyles.find((s) => s.id === "purple")?.unlocked
    ) {
      // Unlock purple portal at 12 characters
      const purplePortalIndex = updatedStyles.findIndex(
        (s) => s.id === "purple"
      );
      if (purplePortalIndex !== -1) {
        updatedStyles[purplePortalIndex].unlocked = true;
        unlocked = true;

        setTimeout(() => {
          Alert.alert(
            "New Portal Style Unlocked!",
            "You've unlocked the Purple Portal style!"
          );
        }, 1000);
      }
    } else if (
      characterCount >= 20 &&
      !portalStyles.find((s) => s.id === "gold")?.unlocked
    ) {
      // Unlock gold portal at 20 characters
      const goldPortalIndex = updatedStyles.findIndex((s) => s.id === "gold");
      if (goldPortalIndex !== -1) {
        updatedStyles[goldPortalIndex].unlocked = true;
        unlocked = true;

        setTimeout(() => {
          Alert.alert(
            "New Portal Style Unlocked!",
            "You've unlocked the Gold Portal style!"
          );
        }, 1000);
      }
    }

    if (unlocked) {
      setPortalStyles(updatedStyles);
      await AsyncStorage.setItem(
        PORTAL_STYLES_KEY,
        JSON.stringify(updatedStyles)
      );
    }
  };

  const viewFoundCharacter = () => {
    if (discoveredCharacter) {
      setShowCharacterModal(false);
      // Navigate to character detail
      navigation.navigate("CharacterDetail", {
        character: discoveredCharacter,
      });
    }
  };

  const getProgressInRegion = (region: MapRegion) => {
    const total = region.locations.length;
    const discovered = region.locations.filter((loc) =>
      discoveredLocations.includes(loc.id)
    ).length;

    return {
      discovered,
      total,
      percent: total > 0 ? (discovered / total) * 100 : 0,
    };
  };

  const getOverallProgress = () => {
    const allLocations = locations.length;
    const discovered = discoveredLocations.length;

    return {
      discovered,
      total: allLocations,
      percent: allLocations > 0 ? (discovered / allLocations) * 100 : 0,
    };
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.highlight,
    },
    statsContainer: {
      backgroundColor: colors.card,
      margin: 16,
      borderRadius: 16,
      padding: 16,
    },
    statRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    statLabel: {
      color: colors.text,
      fontSize: 16,
    },
    statValue: {
      color: colors.highlight,
      fontWeight: "bold",
      fontSize: 16,
    },
    mapContainer: {
      flex: 1,
      margin: 16,
    },
    mapRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 16,
    },
    regionButton: {
      width: 150,
      height: 150,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 16,
      padding: 12,
      backgroundColor: colors.card,
    },
    regionLocked: {
      opacity: 0.5,
    },
    regionButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "bold",
      marginTop: 8,
      textAlign: "center",
    },
    regionImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    regionProgress: {
      fontSize: 12,
      color: colors.accent,
      marginTop: 4,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.7)",
    },
    modalCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      width: "85%",
      maxHeight: "80%",
    },
    modalTitle: {
      color: colors.highlight,
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 12,
      textAlign: "center",
    },
    modalDescription: {
      color: colors.text,
      fontSize: 16,
      marginBottom: 16,
    },
    modalImage: {
      width: "100%",
      height: 150,
      borderRadius: 8,
      marginBottom: 16,
    },
    closeButton: {
      backgroundColor: colors.highlight,
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 16,
    },
    closeButtonText: {
      color: "#fff",
      fontWeight: "bold",
    },
    locationsList: {
      maxHeight: 300,
    },
    locationItem: {
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
    },
    locationVisited: {
      borderLeftWidth: 4,
      borderLeftColor: colors.highlight,
    },
    locationItemText: {
      color: colors.text,
      fontSize: 16,
      flex: 1,
      marginLeft: 10,
    },
    portalAnimation: {
      width: 100,
      height: 100,
      alignSelf: "center",
      marginBottom: 20,
    },
    characterModalTitle: {
      color: colors.highlight,
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 8,
      textAlign: "center",
    },
    characterModalSubtitle: {
      color: colors.accent,
      fontSize: 18,
      marginBottom: 20,
      textAlign: "center",
    },
    characterModalImage: {
      width: 150,
      height: 150,
      borderRadius: 75,
      alignSelf: "center",
      marginBottom: 20,
      borderWidth: 3,
      borderColor: colors.highlight,
    },
    viewButton: {
      backgroundColor: colors.highlight,
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    viewButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.accent + "33",
      borderRadius: 3,
      marginTop: 8,
      marginBottom: 16,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: colors.highlight,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.highlight} />
        <Text style={{ color: colors.text, marginTop: 12 }}>
          Loading map data...
        </Text>
      </View>
    );
  }

  const overallProgress = getOverallProgress();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.highlight} />
        </TouchableOpacity>
        <Text style={styles.title}>Location Map</Text>
        <Ionicons name="map-outline" size={28} color={colors.highlight} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Locations Discovered</Text>
          <Text style={styles.statValue}>
            {overallProgress.discovered}/{overallProgress.total}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${overallProgress.percent}%` },
            ]}
          />
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Characters Found</Text>
          <Text style={styles.statValue}>{discoveredCharacters.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Regions Unlocked</Text>
          <Text style={styles.statValue}>
            {regions.filter((r) => r.unlocked).length}/{regions.length}
          </Text>
        </View>
      </View>

      <FlatList
        data={regions}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        renderItem={({ item }) => {
          const progress = getProgressInRegion(item);

          return (
            <TouchableOpacity
              style={[
                styles.regionButton,
                !item.unlocked && styles.regionLocked,
                { margin: 8, flex: 1 },
              ]}
              onPress={() => selectRegion(item)}
              activeOpacity={item.unlocked ? 0.7 : 1}
            >
              <Image source={item.image} style={styles.regionImage} />
              <Text style={styles.regionButtonText}>{item.name}</Text>
              <Text style={styles.regionProgress}>
                {progress.discovered}/{progress.total} Explored
              </Text>
              {!item.unlocked && (
                <Ionicons name="lock-closed" size={24} color={colors.accent} />
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ padding: 8 }}
      />

      {/* Region Modal */}
      <Modal
        visible={showRegionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRegionModal(false)}
      >
        <View style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                transform: [
                  {
                    scale: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {selectedRegion && (
              <>
                <Text style={styles.modalTitle}>{selectedRegion.name}</Text>
                <Image
                  source={selectedRegion.image}
                  style={styles.modalImage}
                />

                <Text style={styles.modalDescription}>
                  {`Explore the locations of ${
                    selectedRegion.name
                  }. You've discovered ${
                    getProgressInRegion(selectedRegion).discovered
                  } out of ${
                    getProgressInRegion(selectedRegion).total
                  } locations.`}
                </Text>

                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${
                          getProgressInRegion(selectedRegion).percent
                        }%`,
                      },
                    ]}
                  />
                </View>

                <FlatList
                  data={selectedRegion.locations}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.locationsList}
                  renderItem={({ item }) => {
                    const isVisited = discoveredLocations.includes(item.id);

                    return (
                      <TouchableOpacity
                        style={[
                          styles.locationItem,
                          isVisited && styles.locationVisited,
                        ]}
                        onPress={() => {
                          setShowRegionModal(false);
                          setTimeout(() => selectLocation(item), 300);
                        }}
                      >
                        <Ionicons
                          name={
                            isVisited ? "checkmark-circle" : "location-outline"
                          }
                          size={24}
                          color={isVisited ? colors.highlight : colors.text}
                        />
                        <Text style={styles.locationItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    );
                  }}
                />

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowRegionModal(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Location Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            {selectedLocation && (
              <>
                <Animated.View style={styles.portalAnimation}>
                  <Image
                    source={require("../assets/portal.gif")}
                    style={{
                      width: 100,
                      height: 100,
                    }}
                  />
                </Animated.View>

                <Text style={styles.modalTitle}>{selectedLocation.name}</Text>

                <Text style={styles.modalDescription}>
                  <Text style={{ fontWeight: "bold" }}>Type:</Text>{" "}
                  {selectedLocation.type || "Unknown"}
                </Text>

                <Text style={styles.modalDescription}>
                  <Text style={{ fontWeight: "bold" }}>Dimension:</Text>{" "}
                  {selectedLocation.dimension || "Unknown"}
                </Text>

                <Text style={styles.modalDescription}>
                  {selectedLocation.description ||
                    `A ${
                      selectedLocation.type?.toLowerCase() ||
                      "mysterious location"
                    } in the ${
                      selectedLocation.dimension || "unknown dimension"
                    }.`}
                </Text>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowLocationModal(false);
                    rotateAnim.setValue(0); // Reset animation
                  }}
                >
                  <Text style={styles.closeButtonText}>Continue</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Character Discovery Modal */}
      <Modal
        visible={showCharacterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCharacterModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            {discoveredCharacter && (
              <>
                <Text style={styles.characterModalTitle}>Character Found!</Text>
                <Text style={styles.characterModalSubtitle}>
                  You discovered a new character!
                </Text>

                <Image
                  source={{ uri: discoveredCharacter.image }}
                  style={styles.characterModalImage}
                />

                <Text style={styles.modalTitle}>
                  {discoveredCharacter.name}
                </Text>

                <Text style={styles.modalDescription}>
                  <Text style={{ fontWeight: "bold" }}>Species:</Text>{" "}
                  {discoveredCharacter.species || "Unknown"}
                </Text>

                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={viewFoundCharacter}
                >
                  <Text style={styles.viewButtonText}>View Character</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
