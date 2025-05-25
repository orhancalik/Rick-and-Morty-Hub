import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Button,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../theme/ThemeContext";
import { LightThemeColors, DarkThemeColors } from "../theme/colors";
import { Character } from "../types";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { IconProps } from "@expo/vector-icons/build/createIconSet";
import * as Haptics from "expo-haptics";
import DashboardCard from "../components/DashboardCard";
import CharacterOfTheDay from "../components/CharacterOfTheDay";
import QuoteOfTheDay from "../components/QuoteOfTheDay";

const PROFILE_KEY = "profilePhoto";
const ACHIEVEMENTS_KEY = "userAchievements";
const USER_LEVEL_KEY = "userLevelData";
const PORTAL_STYLE_KEY = "portalStyle";
const BADGES_KEY = "userBadges";

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  requirement: number;
  key: string;
  xpReward: number;
  unlockReward?: string;
};

type Badge = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  unlocked: boolean;
};

type PortalStyle = {
  id: string;
  name: string;
  color: string;
  unlocked: boolean;
};

const achievements: Achievement[] = [
  {
    id: "portal_jumper",
    title: "Portal Jumper",
    description: "Use the portal 5 times",
    icon: "planet-outline",
    requirement: 5,
    key: "portalUses",
    xpReward: 50,
    unlockReward: "Green Portal",
  },
  {
    id: "collector",
    title: "Collector",
    description: "Add 3 characters to favorites",
    icon: "star-outline",
    requirement: 3,
    key: "favoritesCount",
    xpReward: 30,
    unlockReward: "Collector Badge",
  },
  {
    id: "explorer",
    title: "Explorer",
    description: "Visit all sections of the app",
    icon: "compass-outline",
    requirement: 3,
    key: "sectionsVisited",
    xpReward: 40,
    unlockReward: "Blue Portal",
  },
  {
    id: "fanatic",
    title: "Rick and Morty Fanatic",
    description: "Use the app for 5 days",
    icon: "trophy-outline",
    requirement: 5,
    key: "daysActive",
    xpReward: 75,
    unlockReward: "Fanatic Badge",
  },
  {
    id: "series_binger",
    title: "Series Binger",
    description: "Watch 10 episodes of the show",
    icon: "tv-outline",
    requirement: 10,
    key: "episodesWatched",
    xpReward: 100,
    unlockReward: "Red Portal",
  },
  {
    id: "quiz_master",
    title: "Quiz Master",
    description: "Complete 5 character quizzes",
    icon: "school-outline",
    requirement: 5,
    key: "quizzesCompleted",
    xpReward: 75,
    unlockReward: "Gold Portal",
  },
  {
    id: "location_explorer",
    title: "Location Explorer",
    description: "Discover 15 locations on the map",
    icon: "map-outline",
    requirement: 15,
    key: "locationsDiscovered",
    xpReward: 75,
    unlockReward: "Purple Portal",
  },
];

const defaultPortalStyles: PortalStyle[] = [
  {
    id: "default",
    name: "Default Portal",
    color: "#80ff72",
    unlocked: true,
  },
  {
    id: "green",
    name: "Green Portal",
    color: "#00ff00",
    unlocked: false,
  },
  {
    id: "blue",
    name: "Blue Portal",
    color: "#00bfff",
    unlocked: false,
  },
  {
    id: "red",
    name: "Red Portal",
    color: "#ff4500",
    unlocked: false,
  },
  {
    id: "gold",
    name: "Gold Portal",
    color: "#ffd700",
    unlocked: false,
  },
];

const defaultBadges: Badge[] = [
  {
    id: "collector_badge",
    title: "Collector",
    icon: "ribbon-outline",
    description: "You've collected 3 favorite characters",
    unlocked: false,
  },
  {
    id: "fanatic_badge",
    title: "Rick and Morty Fanatic",
    icon: "flame-outline",
    description: "You've used the app for 5 days",
    unlocked: false,
  },
  {
    id: "master_badge",
    title: "Dimension Master",
    icon: "trophy-outline",
    description: "Reach level 5 to unlock",
    unlocked: false,
  },
];

const levelThresholds = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];

export default function ProfileScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Character[]>([]);
  const [userAchievements, setUserAchievements] = useState<
    Record<string, number>
  >({
    portalUses: 0,
    favoritesCount: 0,
    sectionsVisited: 0,
    daysActive: 0,
    episodesWatched: 0,
    quizzesCompleted: 0,
    locationsDiscovered: 0,
  });
  const [userLevel, setUserLevel] = useState({
    level: 1,
    xp: 0,
    nextLevelXp: 100,
  });
  const [portalStyles, setPortalStyles] =
    useState<PortalStyle[]>(defaultPortalStyles);
  const [badges, setBadges] = useState<Badge[]>(defaultBadges);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [rewardModalVisible, setRewardModalVisible] = useState(false);
  const [currentReward, setCurrentReward] = useState({
    title: "",
    message: "",
    icon: "star-outline" as keyof typeof Ionicons.glyphMap,
  });

  const { theme } = useTheme();
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;

  // Animation values
  const xpBarWidth = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const xpProgress =
      (userLevel.xp - levelThresholds[userLevel.level - 1]) /
      (userLevel.nextLevelXp - levelThresholds[userLevel.level - 1]);

    Animated.timing(xpBarWidth, {
      toValue: xpProgress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [userLevel]);

  useEffect(() => {
    checkNewlyCompletedAchievements();
  }, [userAchievements]);

  const loadUserData = async () => {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_KEY);
      if (stored) setImage(stored);

      const favs = await AsyncStorage.getItem("favorites");
      const favoritesData = favs ? JSON.parse(favs) : [];
      setFavorites(favoritesData);

      const achievements = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      const achievementsData = achievements
        ? JSON.parse(achievements)
        : {
            portalUses: 0,
            favoritesCount: 0,
            sectionsVisited: 0,
            daysActive: 1,
            episodesWatched: 0,
            quizzesCompleted: 0,
            locationsDiscovered: 0,
          };
      setUserAchievements(achievementsData);

      const levelData = await AsyncStorage.getItem(USER_LEVEL_KEY);
      if (levelData) {
        setUserLevel(JSON.parse(levelData));
      }

      const portalStylesData = await AsyncStorage.getItem(PORTAL_STYLE_KEY);
      if (portalStylesData) {
        setPortalStyles(JSON.parse(portalStylesData));
      }

      const badgesData = await AsyncStorage.getItem(BADGES_KEY);
      if (badgesData) {
        setBadges(JSON.parse(badgesData));
      }

      const selected = await AsyncStorage.getItem("selectedBadge");
      if (selected) setSelectedBadge(selected);

      updateLoginStreak();
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const checkNewlyCompletedAchievements = async () => {
    const completedBefore =
      (await AsyncStorage.getItem("completedAchievements")) || "[]";
    const previouslyCompleted = new Set(JSON.parse(completedBefore));
    const nowCompleted: string[] = [];

    achievements.forEach((achievement) => {
      const isCompleted =
        userAchievements[achievement.key] >= achievement.requirement;

      if (isCompleted && !previouslyCompleted.has(achievement.id)) {
        nowCompleted.push(achievement.id);
        awardAchievement(achievement);
      }

      if (isCompleted) {
        previouslyCompleted.add(achievement.id);
      }
    });

    await AsyncStorage.setItem(
      "completedAchievements",
      JSON.stringify([...previouslyCompleted])
    );
  };

  const awardAchievement = (achievement: Achievement) => {
    addXP(achievement.xpReward);

    if (achievement.unlockReward) {
      if (achievement.unlockReward.includes("Badge")) {
        // Unlock badge
        const newBadges = badges.map((badge) => {
          if (badge.id.toLowerCase().includes(achievement.id.split("_")[0])) {
            return { ...badge, unlocked: true };
          }
          return badge;
        });

        setBadges(newBadges);
        AsyncStorage.setItem(BADGES_KEY, JSON.stringify(newBadges));

        // Auto-select if no badge is selected
        if (!selectedBadge) {
          const firstUnlocked = newBadges.find((b) => b.unlocked);
          if (firstUnlocked) {
            setSelectedBadge(firstUnlocked.id);
            AsyncStorage.setItem("selectedBadge", firstUnlocked.id);
          }
        }
      } else {
        // Unlock portal style
        const colorName = achievement.unlockReward.split(" ")[0].toLowerCase();
        const newStyles = portalStyles.map((style) => {
          if (style.id.toLowerCase() === colorName) {
            return { ...style, unlocked: true };
          }
          return style;
        });

        setPortalStyles(newStyles);
        AsyncStorage.setItem(PORTAL_STYLE_KEY, JSON.stringify(newStyles));
      }
    }

    // Show reward modal
    showRewardModal(
      "Achievement Unlocked!",
      `You've earned ${achievement.xpReward}XP and unlocked: ${achievement.title}`,
      achievement.icon
    );
  };

  const addXP = async (amount: number) => {
    const updatedLevel = { ...userLevel };
    updatedLevel.xp += amount;

    // Check for level up
    while (
      updatedLevel.xp >= updatedLevel.nextLevelXp &&
      updatedLevel.level < levelThresholds.length - 1
    ) {
      updatedLevel.level += 1;
      updatedLevel.nextLevelXp = levelThresholds[updatedLevel.level];

      // Trigger level up celebration
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showRewardModal(
        "Level Up!",
        `Congratulations! You've reached level ${updatedLevel.level}!`,
        "trophy-outline"
      );

      // Check if we unlock the master badge
      if (updatedLevel.level >= 5) {
        const newBadges = badges.map((badge) => {
          if (badge.id === "master_badge") {
            return { ...badge, unlocked: true };
          }
          return badge;
        });
        setBadges(newBadges);
        AsyncStorage.setItem(BADGES_KEY, JSON.stringify(newBadges));
      }
    }

    setUserLevel(updatedLevel);
    await AsyncStorage.setItem(USER_LEVEL_KEY, JSON.stringify(updatedLevel));
  };

  const showRewardModal = (
    title: string,
    message: string,
    icon: keyof typeof Ionicons.glyphMap
  ) => {
    setCurrentReward({ title, message, icon });
    setRewardModalVisible(true);

    // Trigger celebration animation
    Animated.sequence([
      Animated.timing(celebrationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(celebrationOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Vibrate for feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const updateLoginStreak = async () => {
    try {
      const lastLogin = await AsyncStorage.getItem("lastLoginDate");
      const today = new Date().toDateString();

      if (lastLogin !== today) {
        const newAchievements = { ...userAchievements };
        newAchievements.daysActive += 1;
        setUserAchievements(newAchievements);

        await AsyncStorage.setItem(
          ACHIEVEMENTS_KEY,
          JSON.stringify(newAchievements)
        );
        await AsyncStorage.setItem("lastLoginDate", today);

        // Give daily XP reward
        addXP(15);
      }
    } catch (error) {
      console.error("Error updating login streak:", error);
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!res.canceled && res.assets.length > 0) {
      setImage(res.assets[0].uri);
      await AsyncStorage.setItem(PROFILE_KEY, res.assets[0].uri);
      Alert.alert("Gelukt", "Profielfoto opgeslagen!");
    }
  };

  const removePhoto = async () => {
    setImage(null);
    await AsyncStorage.removeItem(PROFILE_KEY);
  };

  const removeFavorite = async (character: Character) => {
    Alert.alert(
      "Verwijderen",
      `Wil je ${character.name} verwijderen uit je favorieten?`,
      [
        { text: "Annuleren", style: "cancel" },
        {
          text: "Verwijderen",
          style: "destructive",
          onPress: async () => {
            const updatedFavorites = favorites.filter(
              (fav) => fav.id !== character.id
            );
            setFavorites(updatedFavorites);
            await AsyncStorage.setItem(
              "favorites",
              JSON.stringify(updatedFavorites)
            );

            // Update achievements
            const newAchievements = { ...userAchievements };
            newAchievements.favoritesCount = updatedFavorites.length;
            setUserAchievements(newAchievements);
            await AsyncStorage.setItem(
              ACHIEVEMENTS_KEY,
              JSON.stringify(newAchievements)
            );
          },
        },
      ]
    );
  };

  const selectBadge = async (badgeId: string) => {
    setSelectedBadge(badgeId);
    await AsyncStorage.setItem("selectedBadge", badgeId);
  };

  const selectPortalStyle = async (styleId: string) => {
    // Set the selected portal style as default in app
    await AsyncStorage.setItem("selectedPortalStyle", styleId);
    Alert.alert("Portal Style Selected", "Your portal style has been updated!");
  };

  const getAchievementProgress = (achievement: Achievement): number => {
    const current = userAchievements[achievement.key];
    const required = achievement.requirement;
    return Math.min(current, required) / required;
  };

  const isAchievementCompleted = (achievement: Achievement): boolean => {
    return userAchievements[achievement.key] >= achievement.requirement;
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem("hasCompletedOnboarding");
      Alert.alert(
        "Onboarding Reset",
        "Herstart de app om onboarding opnieuw te zien."
      );
    } catch (error) {
      console.error("Error resetting onboarding:", error);
    }
  };

  const selectedBadgeDetails = badges.find(
    (b) => b.id === selectedBadge && b.unlocked
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 20,
    },
    scrollContainer: {
      paddingBottom: 20,
    },
    section: {
      alignItems: "center",
      marginBottom: 20,
    },
    heading: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.highlight,
      marginBottom: 10,
    },
    avatar: {
      width: 150,
      height: 150,
      borderRadius: 99,
      marginBottom: 24,
      borderWidth: 4,
      borderColor: colors.highlight,
    },
    levelContainer: {
      position: "absolute",
      right: 5,
      top: 5,
      backgroundColor: colors.accent + "80",
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    levelText: {
      color: colors.background,
      fontWeight: "bold",
      fontSize: 18,
    },
    userInfoContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    userInfoText: {
      color: colors.text,
      fontSize: 16,
      marginLeft: 5,
    },
    badgeIcon: {
      marginRight: 10,
    },
    levelProgressContainer: {
      width: "80%",
      height: 12,
      backgroundColor: colors.card,
      borderRadius: 6,
      marginVertical: 10,
      overflow: "hidden",
    },
    levelProgressBar: {
      height: "100%",
      backgroundColor: colors.highlight,
    },
    levelProgressText: {
      fontSize: 12,
      color: colors.text,
      textAlign: "center",
      marginBottom: 10,
    },
    buttonsContainer: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      width: "100%",
      marginBottom: 10,
    },
    tabContainer: {
      flexDirection: "row",
      marginVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.accent + "50",
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
    },
    activeTab: {
      borderBottomWidth: 3,
      borderBottomColor: colors.highlight,
    },
    tabText: {
      color: colors.text,
      fontSize: 16,
    },
    activeTabText: {
      color: colors.highlight,
      fontWeight: "bold",
    },
    favTitle: {
      marginTop: 20,
      marginBottom: 12,
      fontSize: 20,
      color: colors.highlight,
      fontWeight: "bold",
      alignSelf: "flex-start",
      marginLeft: 18,
    },
    favItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      marginVertical: 7,
      borderRadius: 11,
      marginHorizontal: 10,
      justifyContent: "space-between",
    },
    favLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    favAvatar: {
      width: 42,
      height: 42,
      borderRadius: 40,
      margin: 9,
      borderWidth: 2,
      borderColor: colors.accent,
    },
    favName: {
      color: colors.text,
      fontSize: 19,
    },
    leeg: {
      color: colors.accent,
      fontSize: 16,
      textAlign: "center",
      marginTop: 16,
      marginBottom: 20,
    },
    deleteBtn: {
      padding: 10,
    },
    achievementsContainer: {
      width: "100%",
      paddingHorizontal: 15,
    },
    achievement: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 15,
      marginBottom: 12,
      flexDirection: "row",
    },
    achievementCompleted: {
      borderLeftWidth: 5,
      borderLeftColor: "#4CAF50",
    },
    achievementIcon: {
      width: 50,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.accent + "40",
      borderRadius: 25,
      marginRight: 15,
    },
    achievementInfo: {
      flex: 1,
    },
    achievementTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    achievementDesc: {
      fontSize: 14,
      color: colors.text + "CC",
      marginBottom: 8,
    },
    achievementReward: {
      fontSize: 12,
      color: colors.highlight,
      fontWeight: "bold",
      marginBottom: 4,
    },
    progressContainer: {
      height: 6,
      backgroundColor: colors.background,
      borderRadius: 3,
      marginTop: 6,
    },
    progressBar: {
      height: "100%",
      borderRadius: 3,
    },
    progressCompleted: {
      backgroundColor: "#4CAF50",
    },
    progressIncomplete: {
      backgroundColor: colors.highlight,
    },
    progressText: {
      fontSize: 12,
      color: colors.text + "99",
      marginTop: 4,
    },
    sectionTitle: {
      width: "100%",
      paddingHorizontal: 18,
    },
    badgesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-around",
      paddingHorizontal: 10,
      marginTop: 10,
    },
    badgeItem: {
      width: 70,
      height: 90,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 15,
    },
    badge: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 5,
    },
    badgeLocked: {
      opacity: 0.3,
    },
    badgeSelected: {
      borderWidth: 3,
      borderColor: colors.highlight,
    },
    badgeTitle: {
      fontSize: 10,
      color: colors.text,
      textAlign: "center",
    },
    portalStyleContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-around",
      paddingHorizontal: 10,
      marginTop: 10,
    },
    portalStyleItem: {
      width: 80,
      height: 100,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 15,
      marginHorizontal: 5,
    },
    portalStyle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 5,
    },
    portalStyleLocked: {
      opacity: 0.3,
    },
    portalStyleName: {
      fontSize: 10,
      color: colors.text,
      textAlign: "center",
    },
    portalCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    rewardModal: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.7)",
    },
    rewardModalContent: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 30,
      alignItems: "center",
      width: "80%",
    },
    rewardIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.accent + "30",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    rewardTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.highlight,
      marginBottom: 15,
      textAlign: "center",
    },
    rewardMessage: {
      fontSize: 16,
      color: colors.text,
      textAlign: "center",
      marginBottom: 20,
    },
    rewardButton: {
      backgroundColor: colors.highlight,
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 20,
    },
    rewardButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    confetti: {
      position: "absolute",
      width: 10,
      height: 10,
      backgroundColor: colors.highlight,
      borderRadius: 5,
    },
    dashboardContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-around",
      marginTop: 10,
      paddingHorizontal: 15,
      marginBottom: 20,
    },
    versionContainer: {
      alignItems: "center",
      marginTop: 30,
      marginBottom: 20,
      opacity: 0.6,
    },
    versionText: {
      fontSize: 12,
      color: colors.accent,
      marginBottom: 4,
    },
    resetButton: {
      padding: 10,
      borderRadius: 5,
      marginTop: 20,
      alignSelf: "center",
    },
  });

  // State for tab navigation
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <SafeAreaView style={styles.container}>
      {/* Celebration Animation */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: celebrationOpacity,
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        {Array(20)
          .fill(0)
          .map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  backgroundColor: [
                    colors.highlight,
                    colors.accent,
                    "#4CAF50",
                    "#FFC107",
                    "#2196F3",
                  ][i % 5],
                  transform: [
                    { scale: Math.random() * 2 + 1 },
                    { rotate: `${Math.random() * 360}deg` },
                  ],
                },
              ]}
            />
          ))}
      </Animated.View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "profile" && styles.activeTab]}
          onPress={() => setActiveTab("profile")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "profile" && styles.activeTabText,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "achievements" && styles.activeTab]}
          onPress={() => setActiveTab("achievements")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "achievements" && styles.activeTabText,
            ]}
          >
            Achievements
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "rewards" && styles.activeTab]}
          onPress={() => setActiveTab("rewards")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "rewards" && styles.activeTabText,
            ]}
          >
            Rewards
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {activeTab === "profile" && (
          <>
            <View style={styles.section}>
              <View style={{ position: "relative" }}>
                <Image
                  source={
                    image
                      ? { uri: image }
                      : require("../assets/profile-placeholder.png")
                  }
                  style={styles.avatar}
                />
                <View style={styles.levelContainer}>
                  <Text style={styles.levelText}>{userLevel.level}</Text>
                </View>
              </View>

              {/* User Info with Badge */}
              <View style={styles.userInfoContainer}>
                {selectedBadgeDetails && (
                  <Ionicons
                    name={selectedBadgeDetails.icon}
                    size={24}
                    color={colors.highlight}
                    style={styles.badgeIcon}
                  />
                )}
                <Text style={styles.userInfoText}>
                  Level {userLevel.level} Portal Master
                </Text>
              </View>

              {/* XP Progress Bar */}
              <View style={styles.levelProgressContainer}>
                <Animated.View
                  style={[
                    styles.levelProgressBar,
                    {
                      width: xpBarWidth.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.levelProgressText}>
                {userLevel.xp} / {userLevel.nextLevelXp} XP
              </Text>

              <View style={styles.buttonsContainer}>
                <Button
                  title="Kies een foto"
                  onPress={pickImage}
                  color={colors.highlight}
                />
                {image && (
                  <Button
                    title="Verwijder foto"
                    onPress={removePhoto}
                    color={colors.accent}
                  />
                )}
              </View>
            </View>

            {/* Dashboard Section */}
            <Text style={[styles.favTitle, styles.sectionTitle]}>
              Dashboard
            </Text>
            <View style={styles.dashboardContainer}>
              <DashboardCard
                title="Level"
                value={userLevel.level}
                icon="star-outline"
                color="#FFD700"
              />
              <DashboardCard
                title="XP"
                value={`${userLevel.xp}/${userLevel.nextLevelXp}`}
                icon="flash-outline"
                color="#40C4FF"
              />
              <DashboardCard
                title="Locaties Ontdekt"
                value={`${userAchievements.locationsDiscovered || 0}/${
                  achievements.find((a) => a.key === "locationsDiscovered")
                    ?.requirement || 0
                }`}
                icon="map-outline"
                color="#00E676"
              />
              <DashboardCard
                title="Dagen Actief"
                value={userAchievements.daysActive || 0}
                icon="calendar-outline"
                color="#FF4081"
              />
            </View>

            <QuoteOfTheDay />
            <CharacterOfTheDay />

            <Text style={[styles.favTitle, styles.sectionTitle]}>
              Favorieten
            </Text>
            {favorites.length > 0 ? (
              favorites.map((item) => (
                <View key={item.id.toString()} style={styles.favItem}>
                  <View style={styles.favLeft}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.favAvatar}
                    />
                    <Text style={styles.favName}>{item.name}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => removeFavorite(item)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={24}
                      color={colors.accent}
                    />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.leeg}>Geen favorieten gevonden.</Text>
            )}

            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: colors.card }]}
              onPress={resetOnboarding}
            >
              <Text style={{ color: colors.highlight }}>
                Reset Onboarding (Dev)
              </Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === "achievements" && (
          <View>
            <Text style={[styles.favTitle, styles.sectionTitle]}>
              Achievements
            </Text>
            <View style={styles.achievementsContainer}>
              {achievements.map((achievement) => {
                const completed = isAchievementCompleted(achievement);
                const progress = getAchievementProgress(achievement);

                return (
                  <View
                    key={achievement.id}
                    style={[
                      styles.achievement,
                      completed && styles.achievementCompleted,
                    ]}
                  >
                    <View style={styles.achievementIcon}>
                      <Ionicons
                        name={achievement.icon}
                        size={28}
                        color={completed ? "#4CAF50" : colors.highlight}
                      />
                    </View>
                    <View style={styles.achievementInfo}>
                      <Text style={styles.achievementTitle}>
                        {achievement.title}
                      </Text>
                      <Text style={styles.achievementDesc}>
                        {achievement.description}
                      </Text>
                      <Text style={styles.achievementReward}>
                        Reward: {achievement.xpReward}XP{" "}
                        {achievement.unlockReward
                          ? `+ ${achievement.unlockReward}`
                          : ""}
                      </Text>
                      <View style={styles.progressContainer}>
                        <View
                          style={[
                            styles.progressBar,
                            completed
                              ? styles.progressCompleted
                              : styles.progressIncomplete,
                            { width: `${progress * 100}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {`${
                          isNaN(userAchievements[achievement.key])
                            ? 0
                            : Math.min(
                                userAchievements[achievement.key],
                                achievement.requirement
                              )
                        }/${achievement.requirement}`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === "rewards" && (
          <>
            <Text style={[styles.favTitle, styles.sectionTitle]}>Badges</Text>
            <View style={styles.badgesContainer}>
              {badges.map((badge) => (
                <TouchableOpacity
                  key={badge.id}
                  style={styles.badgeItem}
                  onPress={() =>
                    badge.unlocked ? selectBadge(badge.id) : null
                  }
                  disabled={!badge.unlocked}
                >
                  <View
                    style={[
                      styles.badge,
                      !badge.unlocked && styles.badgeLocked,
                      selectedBadge === badge.id && styles.badgeSelected,
                    ]}
                  >
                    <Ionicons
                      name={badge.icon}
                      size={32}
                      color={
                        selectedBadge === badge.id
                          ? colors.highlight
                          : colors.text
                      }
                    />
                  </View>
                  <Text style={styles.badgeTitle}>{badge.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.favTitle, styles.sectionTitle]}>
              Portal Stijlen
            </Text>
            <View style={styles.portalStyleContainer}>
              {portalStyles.map((style) => (
                <TouchableOpacity
                  key={style.id}
                  style={styles.portalStyleItem}
                  onPress={() =>
                    style.unlocked ? selectPortalStyle(style.id) : null
                  }
                  disabled={!style.unlocked}
                >
                  <View
                    style={[
                      styles.portalStyle,
                      !style.unlocked && styles.portalStyleLocked,
                    ]}
                  >
                    <View
                      style={[
                        styles.portalCircle,
                        { backgroundColor: style.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.portalStyleName}>
                    {style.name}
                    {!style.unlocked && " 🔒"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Rick & Morty Hub v1.0.0</Text>
          <Text style={styles.versionText}>© 2025 Created by Orhan Calik</Text>
        </View>
      </ScrollView>

      {/* Reward Modal */}
      <Modal
        visible={rewardModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRewardModalVisible(false)}
      >
        <View style={styles.rewardModal}>
          <View style={styles.rewardModalContent}>
            <View style={styles.rewardIconContainer}>
              <Ionicons
                name={currentReward.icon}
                size={50}
                color={colors.highlight}
              />
            </View>
            <Text style={styles.rewardTitle}>{currentReward.title}</Text>
            <Text style={styles.rewardMessage}>{currentReward.message}</Text>
            <TouchableOpacity
              style={styles.rewardButton}
              onPress={() => setRewardModalVisible(false)}
            >
              <Text style={styles.rewardButtonText}>Geweldig!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
