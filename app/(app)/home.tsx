import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useAuth } from "../../src/hooks/useAppHooks";
import { useTheme } from "../../src/context/ThemeContext";
import { challengeService } from "../../src/services/challengeService";

type FeatureCard = {
  title: string;
  description: string;
  icon: string;
  route: string;
  tone: string;
  toneSoft: string;
  toneSoftDark: string;
};

// Matches web's Home.jsx "Learning Resources" resourceCards grid — same 8
// destinations, same order, same tone family per card. Favorites is kept as
// a 9th mobile-only card since it's already a top-level tab here, even
// though web surfaces it from the profile menu instead of this grid.
const FEATURE_CARDS: FeatureCard[] = [
  {
    title: "Vocabulary",
    description: "Browse and practice the core word library",
    icon: "📚",
    route: "/(app)/vocabulary",
    tone: "#0EA5E9",
    toneSoft: "#E0F2FE",
    toneSoftDark: "#0C4A6E",
  },
  {
    title: "Daily Challenge",
    description: "20 words a day, XP, streaks & leaderboard",
    icon: "🏆",
    route: "/(app)/challenge",
    tone: "#06B6D4",
    toneSoft: "#CFFAFE",
    toneSoftDark: "#164E63",
  },
  {
    title: "Radio",
    description: "Live German radio stations",
    icon: "📻",
    route: "/(app)/radio",
    tone: "#F43F5E",
    toneSoft: "#FFE4E6",
    toneSoftDark: "#881337",
  },
  {
    title: "Stories",
    description: "Immersive reading with real-world context",
    icon: "📖",
    route: "/(app)/stories",
    tone: "#14B8A6",
    toneSoft: "#CCFBF1",
    toneSoftDark: "#134E4A",
  },
  {
    title: "Conversation",
    description: "Practice real-world spoken dialogues",
    icon: "💬",
    route: "/(app)/conversations",
    tone: "#6366F1",
    toneSoft: "#E0E7FF",
    toneSoftDark: "#312E81",
  },
  {
    title: "Grammar",
    description: "Master German grammar rules, topic by topic",
    icon: "📐",
    route: "/(app)/grammar",
    tone: "#8B5CF6",
    toneSoft: "#EDE9FE",
    toneSoftDark: "#4C1D95",
  },
  {
    title: "Prefix",
    description: "Understand German word formation",
    icon: "🔤",
    route: "/(app)/prefix",
    tone: "#F59E0B",
    toneSoft: "#FEF3C7",
    toneSoftDark: "#78350F",
  },
  {
    title: "Quiz",
    description: "Test your vocabulary retention",
    icon: "🎮",
    route: "/(app)/quiz",
    tone: "#10B981",
    toneSoft: "#D1FAE5",
    toneSoftDark: "#064E3B",
  },
  {
    title: "Favorites",
    description: "Words you've saved for later",
    icon: "❤️",
    route: "/(app)/favorites",
    tone: "#EC4899",
    toneSoft: "#FCE7F3",
    toneSoftDark: "#831843",
  },
];

function FeatureCardButton({
  card,
  isDark,
  onPress,
}: {
  card: FeatureCard;
  isDark: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.96, { duration: 100 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 150 });
        }}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
            shadowColor: card.tone,
          },
        ]}
      >
        <View
          style={[
            styles.iconChip,
            { backgroundColor: isDark ? card.toneSoftDark : card.toneSoft },
          ]}
        >
          <Text style={styles.iconChipEmoji}>{card.icon}</Text>
        </View>
        <Text
          style={[styles.cardTitle, { color: isDark ? "#F1F5F9" : "#111827" }]}
          numberOfLines={1}
        >
          {card.title}
        </Text>
        <Text
          style={[styles.cardDescription, { color: isDark ? "#94A3B8" : "#6B7280" }]}
          numberOfLines={2}
        >
          {card.description}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const [streak, setStreak] = useState<number | null>(null);

  // Streak is per-account — never call the auth-required endpoint for a
  // logged-out visitor (it would just 401).
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        setStreak(null);
        return;
      }
      challengeService
        .getStreak()
        .then((result) => setStreak(result.currentStreak))
        .catch(() => setStreak(null));
    }, [isAuthenticated]),
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-slate-950"
      showsVerticalScrollIndicator={false}
    >
      {/* Same two-tone wordmark as web's NavBar.jsx ("Sprach" orange-600 +
          "Genie" sky-500) — mobile has no persistent top bar across every
          screen the way web does, so Home (the default landing tab) is
          where the brand actually gets shown while using the app. */}
      <View style={styles.brandRow}>
        <Text style={styles.brandSprach}>Sprach</Text>
        <Text style={styles.brandGenie}>Genie</Text>
      </View>

      <LinearGradient
        colors={isDark ? ["#0C4A6E", "#082F49"] : ["#0EA5E9", "#6366F1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroEyebrow}>{t("welcome").toUpperCase()}</Text>
        <Text style={styles.heroTitle} numberOfLines={1}>
          {user?.name || "Learner"} 👋
        </Text>
        <Text style={styles.heroSubtitle}>
          Keep going — every word gets you closer to fluency.
        </Text>

        <View style={styles.heroRow}>
          <TouchableOpacity
            style={styles.heroCta}
            activeOpacity={0.85}
            onPress={() => router.push("/(app)/challenge" as never)}
          >
            <Text style={styles.heroCtaText}>🎯 Today's Challenge</Text>
          </TouchableOpacity>

          {Boolean(streak) && streak! > 0 && (
            <View style={styles.streakChip}>
              <Text style={styles.streakChipText}>🔥 {streak} day streak</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <View className="flex-row flex-wrap gap-4 px-5 pb-8 pt-6">
        {FEATURE_CARDS.map((card) => (
          <FeatureCardButton
            key={card.title}
            card={card}
            isDark={isDark}
            onPress={() => router.push(card.route as never)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: 20,
    paddingBottom: 4,
  },
  brandSprach: { fontSize: 26, fontWeight: "800", color: "#EA580C" },
  brandGenie: { fontSize: 26, fontWeight: "800", color: "#0EA5E9" },
  hero: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 28,
    padding: 24,
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 6,
  },
  heroTitle: { color: "#FFFFFF", fontSize: 26, fontWeight: "800", marginBottom: 6 },
  heroSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 18 },
  heroRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },
  heroCta: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  heroCtaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  streakChip: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  streakChipText: { color: "#FDE68A", fontWeight: "700", fontSize: 13 },
  cardWrapper: { width: "47%" },
  card: {
    borderRadius: 20,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  iconChip: {
    height: 48,
    width: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconChipEmoji: { fontSize: 22 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  cardDescription: { fontSize: 12, lineHeight: 17 },
});
