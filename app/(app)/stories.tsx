import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "../../src/hooks/useAppHooks";
import { fetchStories } from "../../src/redux/storiesSlice";
import { useTheme } from "../../src/context/ThemeContext";
import ScreenHeader from "../../src/components/ScreenHeader";
import type { Story } from "../../src/services/storyService";

// web's LEVEL_BADGES (StoryTitleList.jsx) — same color per CEFR level.
const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_COLORS: Record<string, string> = {
  A1: "#22C55E",
  A2: "#16A34A",
  B1: "#0EA5E9",
  B2: "#0284C7",
  C1: "#8B5CF6",
  C2: "#7C3AED",
};

export default function StoriesScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { stories, isLoading } = useAppSelector((state) => state.stories);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);
  const { width } = useWindowDimensions();
  const numColumns = width >= 700 ? 3 : 2;
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchStories({}));
  }, [dispatch]);

  const availableLevels = useMemo(() => {
    const present = new Set(
      stories.map((s) => s.level?.level).filter(Boolean) as string[],
    );
    const ordered = CEFR_ORDER.filter((lvl) => present.has(lvl));
    const extras = [...present].filter((lvl) => !CEFR_ORDER.includes(lvl));
    return [...ordered, ...extras];
  }, [stories]);

  const filteredStories = useMemo(
    () =>
      selectedLevel
        ? stories.filter((s) => s.level?.level === selectedLevel)
        : stories,
    [stories, selectedLevel],
  );

  if (isLoading && stories.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: Story }) => {
    const levelLabel = item.level?.level;
    const levelColor = levelLabel ? LEVEL_COLORS[levelLabel] : undefined;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/story/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.coverContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <MaterialCommunityIcons
                name="book-open-page-variant"
                size={36}
                color={isDark ? "#475569" : "#CBD5E1"}
              />
            </View>
          )}

          {Boolean(levelLabel) && (
            <View
              style={[
                styles.levelBadge,
                { backgroundColor: levelColor ?? "#FF6B6B" },
              ]}
            >
              <Text style={styles.levelBadgeText}>{levelLabel}</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardCta}>Read this story →</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="📖 Stories" />

      {availableLevels.length > 0 && (
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, selectedLevel === null && styles.chipActive]}
            onPress={() => setSelectedLevel(null)}
          >
            <Text
              style={[
                styles.chipText,
                selectedLevel === null && styles.chipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {availableLevels.map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[styles.chip, selectedLevel === lvl && styles.chipActive]}
              onPress={() => setSelectedLevel(lvl)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedLevel === lvl && styles.chipTextActive,
                ]}
              >
                {lvl}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filteredStories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No stories yet</Text>}
      />
    </View>
  );
}

const createStyles = (isDark: boolean) => {
  const bg = isDark ? "#020617" : "#FFFFFF";
  const cardBg = isDark ? "#0f172a" : "#F9F9F9";
  const textPrimary = isDark ? "#F1F5F9" : "#333333";
  const textMuted = isDark ? "#94A3B8" : "#666666";
  const placeholderBg = isDark ? "#1e293b" : "#F1F5F9";
  const chipBg = isDark ? "#1e293b" : "#F1F5F9";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg, padding: 16 },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: bg,
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 14,
      justifyContent: "center",
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: chipBg,
    },
    chipActive: { backgroundColor: "#FF6B6B" },
    chipText: { fontSize: 12, fontWeight: "600", color: textMuted },
    chipTextActive: { color: "#FFFFFF" },
    listContent: { paddingBottom: 20 },
    row: { gap: 12 },
    card: {
      flex: 1,
      backgroundColor: cardBg,
      borderRadius: 12,
      marginBottom: 16,
      overflow: "hidden",
    },
    coverContainer: {
      width: "100%",
      height: 120,
      backgroundColor: placeholderBg,
    },
    coverImage: { width: "100%", height: "100%" },
    coverPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    levelBadge: {
      position: "absolute",
      top: 8,
      left: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    levelBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
    cardTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: textPrimary,
      paddingHorizontal: 10,
      paddingTop: 8,
    },
    cardCta: {
      fontSize: 11,
      color: "#FF6B6B",
      fontWeight: "600",
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    emptyText: {
      fontSize: 16,
      color: textMuted,
      textAlign: "center",
      marginTop: 40,
    },
  });
};
