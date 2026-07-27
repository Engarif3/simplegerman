import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../../src/context/ThemeContext";
import { useAppSelector } from "../../../src/hooks/useAppHooks";
import ConfirmDialog from "../../../src/components/ConfirmDialog";
import {
  challengeService,
  ChallengeLevel,
  ChallengeQuestion,
} from "../../../src/services/challengeService";

const QUESTION_TIME_SECONDS = 15;

// Mirrors the backend's scoring constants (challenge.constant.ts) so a
// guest's practice run shows the same live XP feedback the real, persisted
// challenge would — matches web's ChallengeSession.jsx exactly. The guest
// score itself is never sent anywhere; it's purely for display until login.
const CORRECT_FAST_THRESHOLD_SECONDS = 10;
const XP_PER_CORRECT_ANSWER = 10;
const XP_CORRECT_SLOW_ANSWER = 9;
const XP_WRONG_ANSWER_BASE_PENALTY = 2;
const XP_TIMEOUT_PENALTY = 2;

type AnswerFeedback = {
  selectedOption: string;
  correct: boolean;
  correctAnswer: string;
  timedOut: boolean;
  xpDelta: number;
};

export default function ChallengeSessionScreen() {
  const { level } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);
  const levelKey = level as ChallengeLevel;
  const insets = useSafeAreaInsets();

  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [deadlineAt, setDeadlineAt] = useState<number | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<AnswerFeedback | null>(null);
  const [levelFinished, setLevelFinished] = useState(false);
  const [locked, setLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  // react-native-web's Alert.alert is a no-op stub, so the guest "login to
  // save your score" prompt can't use it (it would just silently do
  // nothing, leaving the screen stuck on the last question) — this drives
  // the same ConfirmDialog Modal used elsewhere in the app instead.
  const [guestFinishPrompt, setGuestFinishPrompt] = useState<{
    correctCount: number;
    xpEarned: number;
    totalQuestions: number;
  } | null>(null);

  const streakLoggedRef = useRef(false);
  const timeoutFiredRef = useRef(false);
  // Guest-only wrong-answer streak, kept client-side since a guest's
  // progress is never persisted server-side (mirrors challenge.wrongStreak
  // in the real, logged-in flow) — matches web's guestWrongStreak.
  const guestWrongStreakRef = useRef(0);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    let cancelled = false;

    // Anonymous visitors can actually play — a lightweight "practice"
    // question set that's generated fresh each time and never persisted.
    // Login is only required to save a real, scored attempt.
    if (!isAuthenticated) {
      challengeService
        .getPracticeWords(levelKey)
        .then((result) => {
          if (cancelled) return;
          setQuestions(result.questions);
          setCurrentIndex(0);
          setCorrectCount(0);
          guestWrongStreakRef.current = 0;
          setDeadlineAt(Date.now() + QUESTION_TIME_SECONDS * 1000);
          setIsLoading(false);
        })
        .catch(() => {
          if (!cancelled) {
            setError("Could not load a practice round.");
            setIsLoading(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }

    challengeService
      .getChallengeWords(levelKey)
      .then((result) => {
        if (cancelled) return;
        if (result.locked || result.questions.length === 0) {
          setLocked(true);
          setIsLoading(false);
          return;
        }
        setQuestions(result.questions);
        setCurrentIndex(result.questionsAnswered);
        setCorrectCount(result.correctAnswers);
        setDeadlineAt(
          result.currentQuestionStartedAt
            ? new Date(result.currentQuestionStartedAt).getTime() +
                QUESTION_TIME_SECONDS * 1000
            : null,
        );
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load today's challenge.");
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [levelKey, isAuthenticated]);

  // Ticks the countdown; RN doesn't have a cheap requestAnimationFrame-driven
  // ring here (no SVG dependency in this app), so this drives a simple
  // numeric + bar countdown off the same absolute deadlineAt instead.
  // Gated on focus — React Navigation keeps this screen mounted (not
  // destroyed) when you navigate away via a tab switch or back, so without
  // this the tick (and the auto-timeout effect below) would keep running
  // in the background and silently auto-submit its way through every
  // remaining question until the level finished unattended.
  useEffect(() => {
    if (!isFocused) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [isFocused]);

  const remainingMs = deadlineAt ? Math.max(0, deadlineAt - now) : null;
  const remainingSeconds = remainingMs !== null ? Math.ceil(remainingMs / 1000) : null;

  const currentWord = questions[currentIndex];

  // A guest's score was never saved anywhere — invite them to log in and
  // play for real instead of the normal "Level complete!" summary, matching
  // web's finishLevel guest branch.
  const finishGuestLevel = (
    finalCorrectCount: number,
    finalXpEarned: number,
    totalQuestions: number,
  ) => {
    setGuestFinishPrompt({
      correctCount: finalCorrectCount,
      xpEarned: finalXpEarned,
      totalQuestions,
    });
  };

  const handleAnswer = async (selectedOption: string) => {
    if (answerFeedback || submitting || !currentWord) return;
    setSubmitting(true);
    timeoutFiredRef.current = true;

    if (!isAuthenticated) {
      try {
        const result = await challengeService.checkPracticeAnswer(
          levelKey,
          currentWord.id,
          selectedOption,
        );
        const timedOut = selectedOption === "";
        const isCorrect = Boolean(result.correct) && !timedOut;

        // Mirrors the server's scoring rules using our own countdown
        // deadline, since nothing here is persisted.
        const elapsedMs = deadlineAt
          ? Math.max(0, Date.now() - (deadlineAt - QUESTION_TIME_SECONDS * 1000))
          : 0;
        const answeredFast = elapsedMs <= CORRECT_FAST_THRESHOLD_SECONDS * 1000;

        let xpDelta: number;
        if (isCorrect) {
          xpDelta = answeredFast ? XP_PER_CORRECT_ANSWER : XP_CORRECT_SLOW_ANSWER;
          guestWrongStreakRef.current = 0;
        } else if (timedOut) {
          xpDelta = -XP_TIMEOUT_PENALTY;
          guestWrongStreakRef.current = 0;
        } else {
          guestWrongStreakRef.current += 1;
          xpDelta = -(XP_WRONG_ANSWER_BASE_PENALTY + (guestWrongStreakRef.current - 1));
        }

        const nextCorrectCount = isCorrect ? correctCount + 1 : correctCount;
        const nextXp = sessionXp + xpDelta;

        setCorrectCount(nextCorrectCount);
        setSessionXp(nextXp);
        setAnswerFeedback({
          selectedOption,
          correct: isCorrect,
          correctAnswer: result.correctAnswer,
          timedOut,
          xpDelta,
        });

        const isLast = currentIndex + 1 >= questions.length;

        setTimeout(() => {
          setAnswerFeedback(null);
          setSubmitting(false);
          if (isLast) {
            finishGuestLevel(nextCorrectCount, nextXp, questions.length);
          } else {
            setCurrentIndex((prev) => prev + 1);
            timeoutFiredRef.current = false;
            setDeadlineAt(Date.now() + QUESTION_TIME_SECONDS * 1000);
          }
        }, 1100);
      } catch {
        setSubmitting(false);
        timeoutFiredRef.current = false;
      }
      return;
    }

    try {
      const result = await challengeService.submitAnswer(
        levelKey,
        currentWord.id,
        selectedOption,
      );

      setCorrectCount(result.correctAnswers);
      setSessionXp((prev) => prev + result.xpDelta);
      setAnswerFeedback({
        selectedOption,
        correct: result.correct,
        correctAnswer: result.correctAnswer,
        timedOut: result.timedOut,
        xpDelta: result.xpDelta,
      });

      if (!streakLoggedRef.current) {
        streakLoggedRef.current = true;
        challengeService.completeSession().catch(() => {});
      }

      const isLast = result.completed || currentIndex + 1 >= questions.length;

      setTimeout(() => {
        setAnswerFeedback(null);
        setSubmitting(false);
        if (isLast) {
          setLevelFinished(true);
        } else {
          setCurrentIndex((prev) => prev + 1);
          timeoutFiredRef.current = false;
          setDeadlineAt(
            result.nextQuestionStartedAt
              ? new Date(result.nextQuestionStartedAt).getTime() +
                  QUESTION_TIME_SECONDS * 1000
              : Date.now() + QUESTION_TIME_SECONDS * 1000,
          );
        }
      }, 1100);
    } catch {
      setSubmitting(false);
      timeoutFiredRef.current = false;
    }
  };

  // Auto-submit a timeout once the deadline passes (guarded so it only
  // fires once per question) — shares the exact same submit path as a real
  // tap, matching web (handleTimeout is just handleAnswer("")).
  useEffect(() => {
    if (
      isFocused &&
      remainingMs === 0 &&
      !answerFeedback &&
      !submitting &&
      !timeoutFiredRef.current &&
      currentWord
    ) {
      handleAnswer("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs, isFocused]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (locked || error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.lockedEmoji}>🔒</Text>
        <Text style={styles.lockedText}>
          {error || "You've completed this level for today. Come back tomorrow!"}
        </Text>
        <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Back to Challenge</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (levelFinished) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.finishedEmoji}>🎉</Text>
        <Text style={styles.finishedTitle}>Level Complete!</Text>
        <Text style={styles.finishedScore}>
          You got {correctCount}/{questions.length} right — {sessionXp >= 0 ? "+" : ""}
          {sessionXp} XP
        </Text>
        <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentWord) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const article =
    typeof currentWord.article === "string"
      ? currentWord.article
      : currentWord.article?.name || "";
  const progress = (currentIndex + (answerFeedback ? 1 : 0)) / questions.length;
  const isDanger = remainingSeconds !== null && remainingSeconds <= 5;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={26}
            color={isDark ? "#F1F5F9" : "#333"}
          />
        </TouchableOpacity>
        <Text style={styles.headerCounter}>
          {currentIndex + 1} / {questions.length}
        </Text>
        <Text style={styles.headerXp}>{sessionXp >= 0 ? "+" : ""}{sessionXp} XP</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.timerRow}>
        <Text style={[styles.timerText, isDanger && styles.timerTextDanger]}>
          ⏱ {remainingSeconds ?? QUESTION_TIME_SECONDS}s
        </Text>
      </View>

      <View style={styles.wordCard}>
        <Text style={styles.wordText}>
          {Boolean(article) && <Text style={styles.articleText}>{article} </Text>}
          {currentWord.value}
        </Text>
      </View>

      <View style={styles.optionsGrid}>
        {currentWord.options.map((option, optionIndex) => {
          const isSelected = answerFeedback?.selectedOption === option;
          const isCorrectOption = answerFeedback?.correctAnswer === option;

          return (
            <TouchableOpacity
              key={`${currentWord.id}-${optionIndex}-${option}`}
              style={[
                styles.optionButton,
                Boolean(answerFeedback) && isCorrectOption && styles.optionCorrect,
                Boolean(answerFeedback) &&
                  isSelected &&
                  !isCorrectOption &&
                  styles.optionWrong,
              ]}
              onPress={() => handleAnswer(option)}
              disabled={Boolean(answerFeedback) || submitting}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {answerFeedback && (
        <Text
          style={[
            styles.feedbackText,
            { color: answerFeedback.correct ? "#22C55E" : "#EF4444" },
          ]}
        >
          {answerFeedback.timedOut
            ? `⏱ Time's up! ${answerFeedback.xpDelta} XP`
            : answerFeedback.correct
              ? `✓ Correct! +${answerFeedback.xpDelta} XP`
              : `✗ Wrong. ${answerFeedback.xpDelta} XP`}
        </Text>
      )}

      <ConfirmDialog
        visible={Boolean(guestFinishPrompt)}
        icon=""
        title="Nice work!"
        message={
          guestFinishPrompt
            ? `You got ${guestFinishPrompt.correctCount} / ${guestFinishPrompt.totalQuestions} right — ${
                guestFinishPrompt.xpEarned >= 0 ? "+" : ""
              }${guestFinishPrompt.xpEarned} XP\n\nThis was just practice. Login to save your score and join the leaderboard.`
            : ""
        }
        confirmLabel="Login"
        cancelLabel="Maybe later"
        onConfirm={() => {
          setGuestFinishPrompt(null);
          router.replace("/(auth)/login");
        }}
        onCancel={() => {
          setGuestFinishPrompt(null);
          router.back();
        }}
      />
    </View>
  );
}

const createStyles = (isDark: boolean) => {
  const bg = isDark ? "#020617" : "#FFFFFF";
  const cardBg = isDark ? "#0f172a" : "#F9F9F9";
  const track = isDark ? "#1e293b" : "#E5E7EB";
  const textPrimary = isDark ? "#F1F5F9" : "#1F2937";
  const textMuted = isDark ? "#94A3B8" : "#6B7280";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg, padding: 16 },
    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: bg,
      padding: 24,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    headerCounter: { fontSize: 13, fontWeight: "600", color: textMuted },
    headerXp: { fontSize: 13, fontWeight: "700", color: "#10B981" },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: track,
      overflow: "hidden",
      marginBottom: 16,
    },
    progressFill: { height: "100%", backgroundColor: "#10B981", borderRadius: 3 },
    timerRow: { alignItems: "center", marginBottom: 16 },
    timerText: { fontSize: 16, fontWeight: "700", color: textPrimary },
    timerTextDanger: { color: "#EF4444" },
    wordCard: {
      backgroundColor: cardBg,
      borderRadius: 16,
      paddingVertical: 28,
      alignItems: "center",
      marginBottom: 20,
    },
    wordText: {
      fontSize: 28,
      fontWeight: "700",
      color: textPrimary,
      textTransform: "capitalize",
    },
    articleText: { color: "#FF6B6B" },
    optionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    optionButton: {
      width: "47%",
      backgroundColor: cardBg,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
    },
    // Solid pastel in light mode reads fine against the near-black default
    // text color, but the same pastel in dark mode was nearly invisible
    // against near-white text — a translucent tint over the dark card
    // keeps the highlight dark enough for light text to stay readable.
    optionCorrect: {
      borderColor: "#22C55E",
      backgroundColor: isDark ? "rgba(34, 197, 94, 0.25)" : "#DCFCE7",
    },
    optionWrong: {
      borderColor: "#EF4444",
      backgroundColor: isDark ? "rgba(239, 68, 68, 0.25)" : "#FEE2E2",
    },
    optionText: { fontSize: 14, fontWeight: "600", color: textPrimary },
    feedbackText: {
      textAlign: "center",
      fontSize: 15,
      fontWeight: "700",
      marginTop: 20,
    },
    lockedEmoji: { fontSize: 44, marginBottom: 12 },
    lockedText: { fontSize: 15, color: textMuted, textAlign: "center", marginBottom: 20 },
    finishedEmoji: { fontSize: 48, marginBottom: 12 },
    finishedTitle: { fontSize: 22, fontWeight: "700", color: textPrimary, marginBottom: 8 },
    finishedScore: { fontSize: 15, color: textMuted, marginBottom: 24, textAlign: "center" },
    doneButton: {
      backgroundColor: "#10B981",
      borderRadius: 12,
      paddingHorizontal: 28,
      paddingVertical: 12,
    },
    doneButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  });
};
