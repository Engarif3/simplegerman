import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useAppSelector } from "../../../src/hooks/useAppHooks";
import { useTheme } from "../../../src/context/ThemeContext";
import {
  challengeService,
  ChallengeLevel,
  LeaderboardResult,
} from "../../../src/services/challengeService";

const LEVELS: { key: ChallengeLevel; label: string }[] = [
  { key: "easy", label: "Easy" },
  { key: "intermediate", label: "Intermediate" },
  { key: "difficult", label: "Difficult" },
];

const RANK_MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

// Fake rows shown (blurred, behind a login overlay) to logged-out visitors
// so the page still communicates "there's a leaderboard here" without ever
// sending the real names/scores to an unauthenticated request — matches
// web's Leaderboard.jsx BLUR_PLACEHOLDER_ENTRIES exactly.
const BLUR_PLACEHOLDER_ENTRIES = Array.from({ length: 8 }, (_, index) => ({
  rank: index + 1,
  displayName: "Anonymous learner",
  weeklyXp: 260 - index * 24,
}));

export default function LeaderboardScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);
  const insets = useSafeAreaInsets();

  const initialLevel = (params.level as ChallengeLevel) || "easy";
  const [level, setLevel] = useState<ChallengeLevel>(initialLevel);
  const [data, setData] = useState<LeaderboardResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // The leaderboard endpoint requires auth — never call it for a logged-out
  // visitor, who instead sees a blurred placeholder (see the render below).
  const load = useCallback(
    async (lvl: ChallengeLevel) => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await challengeService.getLeaderboard(lvl, 20);
        setData(result);
      } catch {
        setError("Could not load the leaderboard.");
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    load(level);
  }, [level, load]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={isDark ? "#F1F5F9" : "#333"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏅 Leaderboard</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.tabsRow}>
        {LEVELS.map((lvl) => (
          <TouchableOpacity
            key={lvl.key}
            style={[styles.tab, level === lvl.key && styles.tabActive]}
            onPress={() => setLevel(lvl.key)}
          >
            <Text style={[styles.tabText, level === lvl.key && styles.tabTextActive]}>
              {lvl.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!isAuthenticated ? (
        <View style={styles.guestWrapper}>
          <View pointerEvents="none">
            <View style={styles.meCard}>
              <Text style={styles.meCardText}>
                Your rank this week: <Text style={styles.meCardRank}>#12</Text>
                {"  ·  "}180 XP
              </Text>
            </View>

            {BLUR_PLACEHOLDER_ENTRIES.map((entry) => (
              <View key={entry.rank} style={styles.row}>
                <Text style={styles.rankText}>
                  {RANK_MEDAL[entry.rank] ?? `#${entry.rank}`}
                </Text>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>AN</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nameText}>{entry.displayName}</Text>
                </View>
                <Text style={styles.xpText}>{entry.weeklyXp} XP</Text>
              </View>
            ))}
          </View>

          <BlurView
            intensity={40}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.guestOverlayContent}>
              <MaterialCommunityIcons
                name="lock"
                size={28}
                color={isDark ? "#E2E8F0" : "#475569"}
              />
              <Text style={styles.guestOverlayText}>Login to see the leaderboard</Text>
              <TouchableOpacity
                style={styles.guestLoginButton}
                onPress={() => router.push("/(auth)/login")}
              >
                <Text style={styles.guestLoginButtonText}>Login</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      ) : isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : error || !data ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={styles.meCard}>
            <Text style={styles.meCardText}>
              Your rank this week:{" "}
              <Text style={styles.meCardRank}>
                {data.me.rank ? `#${data.me.rank}` : "Unranked"}
              </Text>
              {"  ·  "}
              {data.me.weeklyXp} XP
            </Text>
            <Text style={styles.meCardSubtext}>
              Top 20 ranked by XP earned this week. Resets every Monday
              {data.daysUntilReset ? ` · ${data.daysUntilReset} day(s) left` : ""}.
            </Text>
          </View>

          <FlatList
            data={data.entries}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => {
              const isYou = item.userId === user?.id;
              return (
                <View style={[styles.row, isYou && styles.rowYou]}>
                  <Text style={styles.rankText}>
                    {RANK_MEDAL[item.rank] ?? `#${item.rank}`}
                  </Text>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.displayName.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nameText}>
                      {item.displayName}
                      {isYou && <Text style={styles.youChip}>  You</Text>}
                    </Text>
                  </View>
                  <Text style={styles.xpText}>{item.weeklyXp} XP</Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No ranked players yet this week.</Text>
            }
          />
        </>
      )}
    </View>
  );
}

const createStyles = (isDark: boolean) => {
  const bg = isDark ? "#020617" : "#FFFFFF";
  const cardBg = isDark ? "#0f172a" : "#F9F9F9";
  const textPrimary = isDark ? "#F1F5F9" : "#1F2937";
  const textMuted = isDark ? "#94A3B8" : "#6B7280";
  const border = isDark ? "#1e293b" : "#EEEEEE";
  const chipBg = isDark ? "#1e293b" : "#F1F5F9";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg, paddingHorizontal: 16 },
    centerContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
    errorText: { fontSize: 14, color: "#F87171", textAlign: "center" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    headerTitle: { fontSize: 16, fontWeight: "700", color: textPrimary },
    tabsRow: { flexDirection: "row", gap: 8, marginVertical: 14 },
    tab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: chipBg,
      alignItems: "center",
    },
    tabActive: { backgroundColor: "#6366F1" },
    tabText: { fontSize: 12, fontWeight: "600", color: textMuted },
    tabTextActive: { color: "#FFFFFF" },
    meCard: {
      backgroundColor: cardBg,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
    },
    meCardText: { fontSize: 14, fontWeight: "600", color: textPrimary, marginBottom: 4 },
    meCardRank: { color: "#6366F1", fontWeight: "700" },
    meCardSubtext: { fontSize: 11, color: textMuted },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 10,
      marginBottom: 6,
    },
    rowYou: { backgroundColor: isDark ? "#1e293b" : "#EEF2FF" },
    rankText: { fontSize: 14, fontWeight: "700", color: textMuted, width: 32 },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#6366F1",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
    nameText: { fontSize: 13, fontWeight: "600", color: textPrimary },
    youChip: { fontSize: 11, fontWeight: "700", color: "#6366F1" },
    xpText: { fontSize: 13, fontWeight: "700", color: "#10B981" },
    emptyText: {
      fontSize: 13,
      color: textMuted,
      textAlign: "center",
      marginTop: 30,
    },
    guestWrapper: { flex: 1, position: "relative", overflow: "hidden", borderRadius: 16 },
    guestOverlayContent: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 24,
    },
    guestOverlayText: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#E2E8F0" : "#334155",
      textAlign: "center",
    },
    guestLoginButton: {
      backgroundColor: "#F59E0B",
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 10,
      marginTop: 4,
    },
    guestLoginButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  });
};
