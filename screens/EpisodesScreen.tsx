import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Episode } from "../types";
import { useTheme } from "../theme/ThemeContext";
import { LightThemeColors, DarkThemeColors } from "../theme/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const WATCHED_EPISODES_KEY = "watchedEpisodes";
const ACHIEVEMENTS_KEY = "userAchievements";

type WatchedEpisode = {
  id: number;
  rating: number;
  notes: string;
  watchedDate: string;
};

export default function EpisodesScreen() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [watchedEpisodes, setWatchedEpisodes] = useState<
    Record<string, WatchedEpisode>
  >({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [filterWatched, setFilterWatched] = useState(false);

  const { theme } = useTheme();
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;

  useEffect(() => {
    fetch("https://sampleapis.assimilate.be/rickandmorty/episodes")
      .then((res) => res.json())
      .then(setEpisodes);

    loadWatchedEpisodes();
  }, []);

  const loadWatchedEpisodes = async () => {
    try {
      const watched = await AsyncStorage.getItem(WATCHED_EPISODES_KEY);
      if (watched) {
        setWatchedEpisodes(JSON.parse(watched));
      }
    } catch (error) {
      console.error("Error loading watched episodes:", error);
    }
  };

  const handleMarkAsWatched = (episode: Episode) => {
    setSelectedEpisode(episode);
    if (watchedEpisodes[episode.id]) {
      setRating(watchedEpisodes[episode.id].rating);
      setNotes(watchedEpisodes[episode.id].notes);
    } else {
      setRating(0);
      setNotes("");
    }
    setModalVisible(true);
  };

  const saveWatchedEpisode = async () => {
    if (!selectedEpisode) return;

    const newWatchedEpisodes = { ...watchedEpisodes };

    newWatchedEpisodes[selectedEpisode.id] = {
      id: selectedEpisode.id,
      rating,
      notes,
      watchedDate: new Date().toISOString(),
    };

    setWatchedEpisodes(newWatchedEpisodes);
    await AsyncStorage.setItem(
      WATCHED_EPISODES_KEY,
      JSON.stringify(newWatchedEpisodes)
    );

    await updateAchievements(Object.keys(newWatchedEpisodes).length);

    setModalVisible(false);
    setSelectedEpisode(null);
    setRating(0);
    setNotes("");

    Alert.alert("Success", "Episode marked as watched!");
  };

  const updateAchievements = async (watchedCount: number) => {
    try {
      const achievements = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      if (achievements) {
        const achievementsData = JSON.parse(achievements);

        if (!achievementsData.episodesWatched) {
          achievementsData.episodesWatched = 0;
        }

        achievementsData.episodesWatched = watchedCount;
        await AsyncStorage.setItem(
          ACHIEVEMENTS_KEY,
          JSON.stringify(achievementsData)
        );
      }
    } catch (error) {
      console.error("Error updating achievements:", error);
    }
  };

  const removeFromWatched = async (episodeId: number) => {
    const newWatchedEpisodes = { ...watchedEpisodes };
    delete newWatchedEpisodes[episodeId];

    setWatchedEpisodes(newWatchedEpisodes);
    await AsyncStorage.setItem(
      WATCHED_EPISODES_KEY,
      JSON.stringify(newWatchedEpisodes)
    );
    await updateAchievements(Object.keys(newWatchedEpisodes).length);
  };

  const toggleFilter = () => {
    setFilterWatched(!filterWatched);
  };

  const filteredEpisodes = filterWatched
    ? episodes.filter((ep) => watchedEpisodes[ep.id])
    : episodes;

  const watchedCount = Object.keys(watchedEpisodes).length;
  const totalEpisodes = episodes.length;
  const progressPercentage =
    totalEpisodes > 0 ? (watchedCount / totalEpisodes) * 100 : 0;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 15 },
    title: {
      fontSize: 26,
      color: colors.highlight,
      fontWeight: "bold",
      marginBottom: 14,
    },
    item: {
      backgroundColor: colors.card,
      marginVertical: 5,
      padding: 12,
      borderRadius: 9,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    epName: { color: colors.text, fontSize: 18, flex: 1 },
    epInfo: { color: colors.accent, fontSize: 13 },
    watchButton: {
      padding: 8,
    },
    watchedIcon: {
      width: 30,
      alignItems: "center",
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 20,
      width: "80%",
      alignItems: "center",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
    },
    ratingContainer: {
      flexDirection: "row",
      marginVertical: 10,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 5,
      padding: 10,
      color: colors.text,
      width: "100%",
      marginVertical: 10,
      height: 100,
      textAlignVertical: "top",
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      width: "100%",
      marginTop: 15,
    },
    button: {
      backgroundColor: colors.highlight,
      padding: 10,
      borderRadius: 5,
      minWidth: 100,
      alignItems: "center",
    },
    buttonText: {
      color: "#fff",
      fontWeight: "bold",
    },
    cancelButton: {
      backgroundColor: colors.accent,
    },
    progressContainer: {
      height: 20,
      backgroundColor: colors.accent + "30",
      borderRadius: 10,
      marginVertical: 10,
      overflow: "hidden",
    },
    progressBar: {
      height: "100%",
      backgroundColor: colors.highlight,
    },
    progressText: {
      color: colors.text,
      textAlign: "center",
      marginBottom: 10,
    },
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.highlight,
      padding: 8,
      borderRadius: 5,
      marginBottom: 10,
    },
    filterText: {
      color: "#fff",
      marginLeft: 5,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Episodes</Text>

      <Text style={styles.progressText}>
        Watched: {watchedCount}/{totalEpisodes} episodes (
        {Math.round(progressPercentage)}%)
      </Text>
      <View style={styles.progressContainer}>
        <View
          style={[styles.progressBar, { width: `${progressPercentage}%` }]}
        />
      </View>

      <TouchableOpacity style={styles.filterButton} onPress={toggleFilter}>
        <Ionicons
          name={filterWatched ? "eye-off-outline" : "eye-outline"}
          size={16}
          color="#fff"
        />
        <Text style={styles.filterText}>
          {filterWatched ? "Show All Episodes" : "Show Watched Only"}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={filteredEpisodes}
        keyExtractor={(ep) => ep.id?.toString()}
        renderItem={({ item }) => {
          const isWatched = !!watchedEpisodes[item.id];
          return (
            <TouchableOpacity
              style={styles.item}
              onPress={() => handleMarkAsWatched(item)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.epName}>
                  {isWatched && "✓ "}
                  {item.name}
                </Text>
                <Text style={styles.epInfo}>
                  S{item.season}E{item.episode} - {item.air_date}
                </Text>
                {isWatched && (
                  <Text style={styles.epInfo}>
                    Rating: {watchedEpisodes[item.id].rating}/5
                  </Text>
                )}
              </View>
              <View style={styles.watchedIcon}>
                <Ionicons
                  name={isWatched ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={isWatched ? colors.highlight : colors.accent}
                />
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedEpisode?.name}</Text>
            <Text>Rate this episode:</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={rating >= star ? "star" : "star-outline"}
                    size={30}
                    color={colors.highlight}
                    style={{ marginHorizontal: 5 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text>Notes:</Text>
            <TextInput
              style={styles.input}
              multiline
              value={notes}
              onChangeText={setNotes}
              placeholder="Add your thoughts..."
              placeholderTextColor={colors.text + "80"}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  if (selectedEpisode && watchedEpisodes[selectedEpisode.id]) {
                    Alert.alert(
                      "Remove from watched?",
                      "Do you want to remove this episode from your watched list?",
                      [
                        {
                          text: "Yes",
                          onPress: () => {
                            if (selectedEpisode) {
                              removeFromWatched(selectedEpisode.id);
                              setModalVisible(false);
                            }
                          },
                        },
                        {
                          text: "No",
                          onPress: () => setModalVisible(false),
                        },
                      ]
                    );
                  } else {
                    setModalVisible(false);
                  }
                }}
              >
                <Text style={styles.buttonText}>
                  {selectedEpisode && watchedEpisodes[selectedEpisode.id]
                    ? "Remove"
                    : "Cancel"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={saveWatchedEpisode}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
