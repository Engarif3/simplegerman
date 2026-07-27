import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/context/ThemeContext";
import { quizService, QuizWord } from "../../src/services/quizService";
import ConfirmDialog from "../../src/components/ConfirmDialog";
import ScreenHeader from "../../src/components/ScreenHeader";

const QUIZ_LENGTH = 30;
const QUIZ_STORAGE_KEY = "quizState";

const DIFFICULTY_LEVELS: Record<number, { name: string; description: string }> = {
  1: { name: "Easy", description: "Level A1 & A2 words (Beginner)" },
  2: { name: "Difficult", description: "Level B1 & B2 words (Intermediate/Advanced)" },
  3: { name: "Easy + Difficult", description: "All levels mixed together" },
};

interface PersistedQuizState {
  difficulty: number;
  quizWords: QuizWord[];
  currentIndex: number;
  score: number;
  quizStarted: boolean;
}

export default function QuizScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);

  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [availableCount, setAvailableCount] = useState(0);
  const [preparedWords, setPreparedWords] = useState<QuizWord[]>([]);
  const [loadingPool, setLoadingPool] = useState(false);

  const [quizWords, setQuizWords] = useState<QuizWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [usedScore, setUsedScore] = useState(false);
  const [finished, setFinished] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [restoring, setRestoring] = useState(true);

  // Resume an in-progress session (mirrors web's localStorage persistence).
  useEffect(() => {
    AsyncStorage.getItem(QUIZ_STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved: PersistedQuizState = JSON.parse(raw);
        if (saved?.quizStarted && Array.isArray(saved.quizWords)) {
          setDifficulty(saved.difficulty);
          setQuizWords(saved.quizWords);
          setCurrentIndex(saved.currentIndex);
          setScore(saved.score);
          setQuizStarted(true);
        }
      })
      .catch(() => {})
      .finally(() => setRestoring(false));
  }, []);

  // Persist the active session on every change, so it survives closing the app.
  useEffect(() => {
    if (!quizStarted) return;
    const state: PersistedQuizState = {
      difficulty: difficulty ?? 1,
      quizWords,
      currentIndex,
      score,
      quizStarted,
    };
    AsyncStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [difficulty, quizWords, currentIndex, score, quizStarted]);

  const selectDifficulty = useCallback(async (level: number) => {
    setDifficulty(level);
    setLoadingPool(true);
    try {
      const result = await quizService.getQuizWords(level, QUIZ_LENGTH);
      setPreparedWords(result.words);
      setAvailableCount(result.availableCount);
    } catch {
      setPreparedWords([]);
      setAvailableCount(0);
    } finally {
      setLoadingPool(false);
    }
  }, []);

  const startQuiz = () => {
    const session = preparedWords.slice(0, Math.min(QUIZ_LENGTH, preparedWords.length));
    setQuizWords(session);
    setCurrentIndex(0);
    setScore(0);
    setShowMeaning(false);
    setUsedScore(false);
    setFinished(false);
    setQuizStarted(true);
  };

  const handlePronounce = (word: string) => {
    if (Platform.OS === "web") {
      const utterance = new (window as any).SpeechSynthesisUtterance(word);
      utterance.lang = "de-DE";
      (window as any).speechSynthesis.cancel();
      (window as any).speechSynthesis.speak(utterance);
    } else {
      Speech.speak(word, { language: "de-DE", pitch: 1.0, rate: 0.8 });
    }
  };

  const handleScoreAndNext = (correct: boolean) => {
    if (usedScore) return;
    setUsedScore(true);
    const nextScore = correct ? score + 1 : score;
    setScore(nextScore);

    if (currentIndex + 1 >= quizWords.length) {
      setFinished(true);
      setQuizStarted(false);
      AsyncStorage.removeItem(QUIZ_STORAGE_KEY).catch(() => {});
    } else {
      setCurrentIndex((prev) => prev + 1);
      setShowMeaning(false);
      setUsedScore(false);
    }
  };

  const requestReset = () => setResetConfirmOpen(true);

  const confirmReset = () => {
    setResetConfirmOpen(false);
    setQuizStarted(false);
    setFinished(false);
    AsyncStorage.removeItem(QUIZ_STORAGE_KEY).catch(() => {});
  };

  const backToLevelSelect = () => {
    setFinished(false);
    setDifficulty(null);
    setPreparedWords([]);
  };

  if (restoring) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  // ── Finished screen ──────────────────────────────────────────────
  if (finished) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.finishedEmoji}>🎉</Text>
        <Text style={styles.finishedTitle}>Finished!</Text>
        <Text style={styles.finishedScore}>
          Your Score: <Text style={styles.finishedScoreValue}>{score} / {quizWords.length}</Text>
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={backToLevelSelect}>
          <Text style={styles.primaryButtonText}>Choose New Level</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Active quiz session ──────────────────────────────────────────
  if (quizStarted && quizWords.length > 0) {
    const currentWord = quizWords[currentIndex];
    const article =
      typeof currentWord.article === "string"
        ? currentWord.article
        : currentWord.article?.name || "";

    return (
      <View style={styles.container}>
        <View style={styles.sessionHeader}>
          <Text style={styles.questionCounter}>
            Question {currentIndex + 1} of {quizWords.length}
          </Text>
          <TouchableOpacity onPress={requestReset}>
            <Text style={styles.resetLink}>Reset Quiz</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.questionCard}>
          <View style={styles.wordRow}>
            <Text style={styles.wordText}>
              {Boolean(article) && <Text style={styles.articleText}>{article} </Text>}
              {currentWord.value}
            </Text>
            <TouchableOpacity onPress={() => handlePronounce(currentWord.value)}>
              <Text style={styles.speakerEmoji}>🔊</Text>
            </TouchableOpacity>
          </View>

          {!showMeaning ? (
            <TouchableOpacity
              style={styles.revealButton}
              onPress={() => setShowMeaning(true)}
            >
              <Text style={styles.revealButtonText}>🔍 Reveal Meaning</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.meaningText}>
              {currentWord.meaning.join(", ")}
            </Text>
          )}
        </View>

        {/* Score card — always visible (disabled once used), matching web's
            Quiz.jsx: the ✗/✓ buttons aren't gated behind revealing the
            meaning, since it's an honor-system self-grade either way. */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreCardLabel}>YOUR SCORE</Text>
          <Text style={styles.scoreCardValue}>{score}</Text>
          <View style={styles.selfScoreRow}>
            <TouchableOpacity
              style={[styles.scoreButton, styles.scoreButtonWrong]}
              onPress={() => handleScoreAndNext(false)}
              disabled={usedScore}
            >
              <Text style={styles.scoreButtonText}>✗</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scoreButton, styles.scoreButtonRight]}
              onPress={() => handleScoreAndNext(true)}
              disabled={usedScore}
            >
              <Text style={styles.scoreButtonText}>✓</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ConfirmDialog
          visible={resetConfirmOpen}
          title="Reset Quiz?"
          message="All progress will be lost."
          confirmLabel="Yes, reset"
          cancelLabel="Cancel"
          onConfirm={confirmReset}
          onCancel={() => setResetConfirmOpen(false)}
        />
      </View>
    );
  }

  // ── Difficulty selection screen ──────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <ScreenHeader title="Vocabulary Quiz" />
      <Text style={styles.subtitle}>Test your German vocabulary retention</Text>

      {Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => {
        const levelId = Number(key);
        const isSelected = difficulty === levelId;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.levelCard, isSelected && styles.levelCardActive]}
            onPress={() => selectDifficulty(levelId)}
          >
            <Text style={styles.levelName}>{level.name}</Text>
            <Text style={styles.levelDescription}>{level.description}</Text>
          </TouchableOpacity>
        );
      })}

      {difficulty !== null && (
        <View style={styles.statsCard}>
          {loadingPool ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <>
              <Text style={styles.statsText}>Quiz Length: {QUIZ_LENGTH}</Text>
              <Text style={styles.statsText}>Available Words: {availableCount}</Text>
            </>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (loadingPool || preparedWords.length === 0) && styles.primaryButtonDisabled,
        ]}
        onPress={startQuiz}
        disabled={loadingPool || preparedWords.length === 0}
      >
        <Text style={styles.primaryButtonText}>Start Quiz</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (isDark: boolean) => {
  const bg = isDark ? "#020617" : "#FFFFFF";
  const cardBg = isDark ? "#0f172a" : "#F9F9F9";
  const textPrimary = isDark ? "#F1F5F9" : "#1F2937";
  const textMuted = isDark ? "#94A3B8" : "#6B7280";
  const border = isDark ? "#1e293b" : "#E5E7EB";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg, padding: 16 },
    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: bg,
      padding: 24,
    },
    subtitle: {
      fontSize: 13,
      color: textMuted,
      textAlign: "center",
      marginBottom: 20,
    },
    levelCard: {
      backgroundColor: cardBg,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: "transparent",
    },
    levelCardActive: { borderColor: "#10B981" },
    levelName: { fontSize: 16, fontWeight: "700", color: textPrimary, marginBottom: 4 },
    levelDescription: { fontSize: 12, color: textMuted },
    statsCard: {
      backgroundColor: cardBg,
      borderRadius: 12,
      padding: 14,
      marginTop: 4,
      marginBottom: 16,
      alignItems: "center",
    },
    statsText: { fontSize: 13, color: textPrimary, marginBottom: 4 },
    primaryButton: {
      backgroundColor: "#10B981",
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    primaryButtonDisabled: { opacity: 0.5 },
    primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

    sessionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    questionCounter: { fontSize: 13, fontWeight: "600", color: textMuted },
    resetLink: { fontSize: 13, color: "#EF4444", fontWeight: "600" },
    questionCard: {
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: border,
    },
    wordRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
    wordText: {
      fontSize: 30,
      fontWeight: "700",
      color: textPrimary,
      textTransform: "capitalize",
    },
    articleText: { color: "#FF6B6B" },
    speakerEmoji: { fontSize: 26 },
    revealButton: {
      backgroundColor: "#0EA5E9",
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    revealButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
    meaningText: {
      fontSize: 20,
      fontWeight: "600",
      color: "#10B981",
      textAlign: "center",
      marginBottom: 16,
    },
    scoreCard: {
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      marginTop: 16,
      borderWidth: 1,
      borderColor: border,
    },
    scoreCardLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: "#0EA5E9",
      marginBottom: 4,
    },
    scoreCardValue: {
      fontSize: 32,
      fontWeight: "700",
      color: textPrimary,
      marginBottom: 16,
    },
    selfScoreRow: { flexDirection: "row", gap: 24 },
    scoreButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: "center",
      justifyContent: "center",
    },
    scoreButtonWrong: { backgroundColor: "#EF4444" },
    scoreButtonRight: { backgroundColor: "#22C55E" },
    scoreButtonText: { color: "#FFFFFF", fontSize: 26, fontWeight: "700" },

    finishedEmoji: { fontSize: 48, marginBottom: 12 },
    finishedTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: textPrimary,
      marginBottom: 8,
    },
    finishedScore: { fontSize: 16, color: textMuted, marginBottom: 24 },
    finishedScoreValue: { fontWeight: "700", color: "#10B981" },
  });
};
