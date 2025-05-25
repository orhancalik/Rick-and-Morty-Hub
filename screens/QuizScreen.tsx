import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { LightThemeColors, DarkThemeColors } from "../theme/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Character } from "../types";

// Storage keys
const QUIZ_STATS_KEY = "quizStats";
const ACHIEVEMENTS_KEY = "userAchievements";
const USER_LEVEL_KEY = "userLevelData";

// Quiz question types
type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  image?: string;
};

// Quiz stats type
type QuizStats = {
  totalQuestions: number;
  correctAnswers: number;
  quizzesCompleted: number;
  lastQuizDate: string | null;
};

export default function QuizScreen() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [quizActive, setQuizActive] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizStats, setQuizStats] = useState<QuizStats>({
    totalQuestions: 0,
    correctAnswers: 0,
    quizzesCompleted: 0,
    lastQuizDate: null,
  });
  const [showReward, setShowReward] = useState(false);
  const [reward, setReward] = useState({ xp: 0, message: "" });

  // Animation values
  const resultScale = React.useRef(new Animated.Value(0.5)).current;
  const resultOpacity = React.useRef(new Animated.Value(0)).current;

  const { theme } = useTheme();
  const colors = theme === "dark" ? DarkThemeColors : LightThemeColors;

  useEffect(() => {
    fetchCharacters();
    loadQuizStats();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await fetch(
        "https://sampleapis.assimilate.be/rickandmorty/characters"
      );
      const data = await response.json();
      setCharacters(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching characters:", error);
      setLoading(false);
      Alert.alert("Error", "Failed to load characters for quiz");
    }
  };

  const loadQuizStats = async () => {
    try {
      const stats = await AsyncStorage.getItem(QUIZ_STATS_KEY);
      if (stats) {
        setQuizStats(JSON.parse(stats));
      }
    } catch (error) {
      console.error("Error loading quiz stats:", error);
    }
  };

  const saveQuizStats = async (updatedStats: QuizStats) => {
    try {
      await AsyncStorage.setItem(QUIZ_STATS_KEY, JSON.stringify(updatedStats));
    } catch (error) {
      console.error("Error saving quiz stats:", error);
    }
  };

  const generateQuiz = () => {
    if (characters.length < 10) {
      Alert.alert(
        "Not enough characters",
        "Please wait for characters to load"
      );
      return;
    }

    // Shuffle characters and pick 10 for the quiz
    const shuffled = [...characters]
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);
    const newQuestions: QuizQuestion[] = [];

    // Generate different types of questions
    shuffled.forEach((character, index) => {
      const questionType = index % 3; // 3 types of questions

      if (questionType === 0) {
        // Question about species
        newQuestions.push(generateSpeciesQuestion(character, characters));
      } else if (questionType === 1) {
        // Question about origin
        newQuestions.push(generateOriginQuestion(character, characters));
      } else {
        // Question about character image
        newQuestions.push(generateImageQuestion(character, characters));
      }
    });

    setQuestions(newQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizActive(true);
    setQuizFinished(false);
    setSelectedAnswer(null);
  };

  const generateSpeciesQuestion = (
    character: Character,
    allCharacters: Character[]
  ): QuizQuestion => {
    // Get some random species for wrong answers
    const otherSpecies = allCharacters
      .filter((c) => c.species !== character.species)
      .map((c) => c.species)
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // Combine and shuffle options
    const options = [character.species, ...otherSpecies].sort(
      () => 0.5 - Math.random()
    );

    return {
      id: Math.random(),
      question: `What species is ${character.name}?`,
      options,
      correctAnswer: character.species,
      image: character.image,
    };
  };

  const generateOriginQuestion = (
    character: Character,
    allCharacters: Character[]
  ): QuizQuestion => {
    // Get some random origins for wrong answers
    const otherOrigins = allCharacters
      .filter((c) => c.origin !== character.origin && c.origin)
      .map((c) => c.origin)
      .filter(Boolean) // Remove null/undefined
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // Combine and shuffle options
    const options = [character.origin, ...otherOrigins].sort(
      () => 0.5 - Math.random()
    );

    return {
      id: Math.random(),
      question: `Where is ${character.name} from?`,
      options,
      correctAnswer: character.origin,
      image: character.image,
    };
  };

  const generateImageQuestion = (
    character: Character,
    allCharacters: Character[]
  ): QuizQuestion => {
    // Get some random characters for wrong answers
    const otherCharacters = allCharacters
      .filter((c) => c.id !== character.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // Combine and shuffle options
    const options = [
      character.name,
      ...otherCharacters.map((c) => c.name),
    ].sort(() => 0.5 - Math.random());

    return {
      id: Math.random(),
      question: "Who is this character?",
      options,
      correctAnswer: character.name,
      image: character.image,
    };
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return; // Prevent multiple selections

    setSelectedAnswer(answer);

    const isCorrect = answer === questions[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Move to next question after a short delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
      } else {
        finishQuiz();
      }
    }, 1000);
  };

  // Find the finishQuiz function and update how stats are calculated:

  const finishQuiz = async () => {
    setQuizFinished(true);
    setQuizActive(false);

    // Update quiz stats - Fix the increment logic here
    const updatedStats = {
      ...quizStats,
      totalQuestions: quizStats.totalQuestions + questions.length,
      correctAnswers: quizStats.correctAnswers + score,
      quizzesCompleted: quizStats.quizzesCompleted + 1, // Ensure this is incrementing
      lastQuizDate: new Date().toISOString(),
    };

    // Log for debugging
    console.log("Quiz completed. New stats:", updatedStats);

    setQuizStats(updatedStats);
    await saveQuizStats(updatedStats);

    // Calculate XP reward (base + bonus for good score)
    const correctPercentage = score / questions.length;
    let xpReward = 15; // Base XP

    if (correctPercentage >= 0.8) {
      xpReward += 20; // Bonus for 80%+ correct
    } else if (correctPercentage >= 0.6) {
      xpReward += 10; // Bonus for 60%+ correct
    }

    // Update achievements with the updated stats
    await updateAchievements(updatedStats, xpReward);

    // Show reward
    setReward({
      xp: xpReward,
      message: `You got ${score} out of ${questions.length} correct!`,
    });
    setShowReward(true);

    // Animate result
    Animated.parallel([
      Animated.spring(resultScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
      }),
      Animated.timing(resultOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const updateAchievements = async (stats: QuizStats, xpReward: number) => {
    try {
      // Update user level with XP reward
      const levelData = await AsyncStorage.getItem(USER_LEVEL_KEY);
      if (levelData) {
        const userLevel = JSON.parse(levelData);
        userLevel.xp += xpReward;

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

      // Update quiz achievements
      const achievementsData = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      if (achievementsData) {
        const achievements = JSON.parse(achievementsData);

        // Make sure we have a number for quizzesCompleted
        // This is the key fix - properly reading and incrementing the counter
        achievements.quizzesCompleted = stats.quizzesCompleted;

        // Log for debugging
        console.log(
          "Updated quizzes completed:",
          achievements.quizzesCompleted
        );

        // Save the updated achievements
        await AsyncStorage.setItem(
          ACHIEVEMENTS_KEY,
          JSON.stringify(achievements)
        );
      }
    } catch (error) {
      console.error("Error updating achievements:", error);
    }
  };

  const startNewQuiz = () => {
    setShowReward(false);
    generateQuiz();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.highlight,
      marginBottom: 16,
    },
    statsContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    statsLabel: {
      color: colors.text,
      fontSize: 16,
    },
    statsValue: {
      color: colors.highlight,
      fontWeight: "bold",
      fontSize: 16,
    },
    startButton: {
      backgroundColor: colors.highlight,
      padding: 16,
      borderRadius: 30,
      alignItems: "center",
      marginVertical: 20,
    },
    startButtonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "bold",
    },
    quizContainer: {
      flex: 1,
      justifyContent: "space-between",
    },
    questionContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    questionText: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 12,
    },
    characterImage: {
      width: "100%",
      height: 200,
      borderRadius: 12,
      marginBottom: 12,
    },
    progressText: {
      fontSize: 14,
      color: colors.accent,
      marginBottom: 24,
      textAlign: "center",
    },
    optionsContainer: {
      marginTop: 16,
    },
    optionButton: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 8,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
    },
    optionIcon: {
      marginRight: 10,
    },
    optionText: {
      color: colors.text,
      fontSize: 16,
      flex: 1,
    },
    scoreContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 24,
      alignItems: "center",
    },
    scoreTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.highlight,
      marginBottom: 12,
    },
    scoreValue: {
      fontSize: 42,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
    },
    scoreSubtitle: {
      fontSize: 16,
      color: colors.accent,
      marginBottom: 24,
    },
    rewardContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    rewardCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      width: "85%",
      alignItems: "center",
    },
    rewardIcon: {
      marginBottom: 16,
    },
    rewardTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.highlight,
      marginBottom: 12,
      textAlign: "center",
    },
    rewardText: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 16,
      textAlign: "center",
    },
    rewardXP: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },
    rewardXPValue: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.highlight,
      marginLeft: 8,
    },
    rewardButton: {
      backgroundColor: colors.highlight,
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 24,
    },
    rewardButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.highlight} />
        <Text style={{ color: colors.text, marginTop: 16 }}>
          Loading quiz data...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!quizActive ? (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Character Quiz</Text>
            <Ionicons
              name="help-circle-outline"
              size={30}
              color={colors.highlight}
            />
          </View>

          <View style={styles.statsContainer}>
            <Text
              style={[
                styles.statsLabel,
                { marginBottom: 10, fontWeight: "bold" },
              ]}
            >
              Your Quiz Stats
            </Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Quizzes Completed</Text>
              <Text style={styles.statsValue}>
                {quizStats.quizzesCompleted}
              </Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Total Questions</Text>
              <Text style={styles.statsValue}>{quizStats.totalQuestions}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Correct Answers</Text>
              <Text style={styles.statsValue}>{quizStats.correctAnswers}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Accuracy</Text>
              <Text style={styles.statsValue}>
                {quizStats.totalQuestions > 0
                  ? `${Math.round(
                      (quizStats.correctAnswers / quizStats.totalQuestions) *
                        100
                    )}%`
                  : "0%"}
              </Text>
            </View>
          </View>

          {!quizFinished ? (
            <TouchableOpacity style={styles.startButton} onPress={generateQuiz}>
              <Text style={styles.startButtonText}>Start New Quiz</Text>
            </TouchableOpacity>
          ) : (
            <Animated.View
              style={[
                styles.scoreContainer,
                {
                  transform: [{ scale: resultScale }],
                  opacity: resultOpacity,
                },
              ]}
            >
              <Text style={styles.scoreTitle}>Quiz Results</Text>
              <Text style={styles.scoreValue}>
                {score}/{questions.length}
              </Text>
              <Text style={styles.scoreSubtitle}>
                {score === questions.length
                  ? "Perfect! You're a Rick and Morty expert!"
                  : score >= questions.length * 0.8
                  ? "Great job! Almost perfect!"
                  : score >= questions.length * 0.5
                  ? "Not bad! Keep learning!"
                  : "Keep watching the show to improve!"}
              </Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={startNewQuiz}
              >
                <Text style={styles.startButtonText}>Try Again</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </>
      ) : (
        <View style={styles.quizContainer}>
          <View style={styles.questionContainer}>
            <Text style={styles.progressText}>
              Question {currentQuestionIndex + 1} of {questions.length}
            </Text>
            <Text style={styles.questionText}>
              {questions[currentQuestionIndex].question}
            </Text>
            {questions[currentQuestionIndex].image && (
              <Image
                source={{ uri: questions[currentQuestionIndex].image }}
                style={styles.characterImage}
                resizeMode="cover"
              />
            )}
          </View>

          <View style={styles.optionsContainer}>
            {questions[currentQuestionIndex].options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect =
                option === questions[currentQuestionIndex].correctAnswer;
              const showResult = selectedAnswer !== null;

              // Create the style object using the spread operator and type casting
              let finalStyle = { ...styles.optionButton } as any;

              if (showResult) {
                if (isSelected) {
                  finalStyle = {
                    ...finalStyle,
                    borderWidth: 2,
                    borderColor: isCorrect ? "#4CAF50" : colors.accent,
                    backgroundColor: isCorrect
                      ? "#4CAF5033"
                      : colors.accent + "33",
                  };
                } else if (isCorrect) {
                  finalStyle = {
                    ...finalStyle,
                    backgroundColor: "#4CAF5033",
                    borderWidth: 2,
                    borderColor: "#4CAF50",
                  };
                }
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={finalStyle}
                  onPress={() => handleAnswer(option)}
                  disabled={showResult}
                >
                  {showResult && (
                    <Ionicons
                      name={isCorrect ? "checkmark-circle" : "close-circle"}
                      size={24}
                      color={isCorrect ? "#4CAF50" : colors.accent}
                      style={styles.optionIcon}
                    />
                  )}
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* XP Reward Modal */}
      <Modal visible={showReward} transparent animationType="fade">
        <View style={styles.rewardContainer}>
          <View style={styles.rewardCard}>
            <Ionicons
              name="trophy"
              size={60}
              color={colors.highlight}
              style={styles.rewardIcon}
            />
            <Text style={styles.rewardTitle}>Quiz Complete!</Text>
            <Text style={styles.rewardText}>{reward.message}</Text>
            <View style={styles.rewardXP}>
              <Text style={styles.rewardText}>You earned:</Text>
              <Text style={styles.rewardXPValue}>{reward.xp} XP</Text>
            </View>
            <TouchableOpacity
              style={styles.rewardButton}
              onPress={() => setShowReward(false)}
            >
              <Text style={styles.rewardButtonText}>Claim Reward</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
