import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../../src/context/ThemeContext";
import { useAppSelector } from "../../../src/hooks/useAppHooks";
import ScreenHeader from "../../../src/components/ScreenHeader";
import {
  challengeService,
  ChallengeLevel,
  LevelStatusMap,
  LevelStatus,
} from "../../../src/services/challengeService";

const LEVEL_META: Record<ChallengeLevel, { title: string; desc: string; color: string }> = {
  easy: { title: "Easy", desc: "A1 & A2 words", color: "#22C55E" },
  intermediate: { title: "Intermediate", desc: "B1 & B2 words", color: "#0EA5E9" },
  difficult: { title: "Difficult", desc: "All levels mixed", color: "#EF4444" },
};

// Ms until the device's next local midnight — matches web's UnlockCountdown.
function msUntilLocalMidnight(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function formatUnlockCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function ChallengeHomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const isDark = theme === "dark";
  const styles = createStyles(isDark);

  const [levelStatus, setLevelStatus] = useState<LevelStatusMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  // Anonymous visitors can browse the level cards and play practice
  // rounds, but there's no progress/streak to fetch for them — skip the
  // otherwise-401 requests, matching web's ChallengeSession.jsx.
  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLevelStatus(null);
      setStreak(null);
      setIsLoading(false);
      return;
    }

    try {
      const [status, streakResult] = await Promise.all([
        challengeService.getLevelStatus(),
        challengeService.getStreak().catch(() => null),
      ]);
      setLevelStatus(status);
      if (streakResult) setStreak(streakResult.currentStreak);
    } catch {
      setLevelStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Ticks the lock countdowns forward once a minute while any level is locked.
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const levels: ChallengeLevel[] = ["easy", "intermediate", "difficult"];

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="🏆 Daily Challenge"
        right={
          streak !== null && streak > 0 ? (
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>🔥 {streak}</Text>
            </View>
          ) : undefined
        }
      />
      <Text style={styles.subtitle}>20 words a day, every level tracked separately</Text>

      {levels.map((level) => {
        const status: LevelStatus | undefined = levelStatus?.[level];
        const meta = LEVEL_META[level];
        const answered = status?.questionsAnswered ?? 0;
        const total = status?.totalWords || 20;
        const locked = Boolean(status?.locked);
        const progress = Math.min(1, answered / total);

        return (
          <View key={level} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{meta.title}</Text>
              <Text style={styles.cardDesc}>{meta.desc}</Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%`, backgroundColor: meta.color },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {answered}/{total} answered
              {status ? ` · ${status.correctAnswers} correct` : ""}
            </Text>

            <View style={styles.cardActions}>
              {locked ? (
                <View style={styles.lockedButton}>
                  <Text style={styles.lockedButtonText}>
                    🔒 Unlocks in {formatUnlockCountdown(msUntilLocalMidnight())}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.startButton, { backgroundColor: meta.color }]}
                  onPress={() => router.push(`/challenge/${level}`)}
                >
                  <Text style={styles.startButtonText}>
                    {answered > 0 ? "Continue" : "Start"}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.leaderboardLink}
                onPress={() => router.push(`/challenge/leaderboard?level=${level}`)}
              >
                <Text style={styles.leaderboardLinkText}>🏅 Leaderboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How scoring works</Text>
        <Text style={styles.infoText}>• 15 seconds per question, 6 answer choices</Text>
        <Text style={styles.infoText}>• Correct within 10s: +10 XP · slower: +9 XP</Text>
        <Text style={styles.infoText}>• Wrong answers cost more XP the longer your mistake streak runs</Text>
        <Text style={styles.infoText}>• Timeout: -2 XP, resets your mistake streak</Text>
        <Text style={styles.infoText}>• Leaderboard resets weekly, every Monday</Text>
      </View>
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
    },
    subtitle: {
      fontSize: 12,
      color: textMuted,
      textAlign: "center",
      marginBottom: 16,
    },
    streakBadge: {
      backgroundColor: "#FEF3C7",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
    },
    streakBadgeText: { fontSize: 13, fontWeight: "700", color: "#B45309" },
    card: {
      backgroundColor: cardBg,
      borderRadius: 14,
      padding: 16,
      marginBottom: 14,
    },
    cardHeader: { marginBottom: 10 },
    cardTitle: { fontSize: 16, fontWeight: "700", color: textPrimary },
    cardDesc: { fontSize: 12, color: textMuted, marginTop: 2 },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: track,
      overflow: "hidden",
      marginBottom: 6,
    },
    progressFill: { height: "100%", borderRadius: 4 },
    progressLabel: { fontSize: 11, color: textMuted, marginBottom: 12 },
    cardActions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    startButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
    },
    startButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
    lockedButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: isDark ? "#1e293b" : "#E5E7EB",
    },
    lockedButtonText: { fontSize: 12, fontWeight: "600", color: textMuted },
    leaderboardLink: { paddingVertical: 10 },
    leaderboardLinkText: { fontSize: 12, fontWeight: "600", color: "#6366F1" },
    infoCard: {
      backgroundColor: cardBg,
      borderRadius: 14,
      padding: 16,
      marginTop: 4,
    },
    infoTitle: { fontSize: 13, fontWeight: "700", color: textPrimary, marginBottom: 8 },
    infoText: { fontSize: 12, color: textMuted, lineHeight: 18, marginBottom: 2 },
  });
};
