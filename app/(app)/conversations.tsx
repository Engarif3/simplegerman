import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/ThemeContext";
import ScreenHeader from "../../src/components/ScreenHeader";
import {
  conversationService,
  Conversation,
} from "../../src/services/conversationService";
import { splitConversationTopic } from "../../src/utils/splitConversationTopic";

const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_COLORS: Record<string, string> = {
  A1: "#22C55E",
  A2: "#16A34A",
  B1: "#0EA5E9",
  B2: "#0284C7",
  C1: "#8B5CF6",
  C2: "#7C3AED",
};

export default function ConversationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await conversationService.getConversations();
      setConversations(result);
    } catch {
      setError("Could not load conversations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const availableLevels = useMemo(() => {
    const present = new Set(
      conversations.map((c) => c.levels?.level).filter(Boolean) as string[],
    );
    const ordered = CEFR_ORDER.filter((lvl) => present.has(lvl));
    const extras = [...present].filter((lvl) => !CEFR_ORDER.includes(lvl));
    return [...ordered, ...extras];
  }, [conversations]);

  const filtered = useMemo(
    () =>
      selectedLevel
        ? conversations.filter((c) => c.levels?.level === selectedLevel)
        : conversations,
    [conversations, selectedLevel],
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="💬 Conversations" />
      <Text style={styles.subtitle}>Practice real-world German dialogues</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

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
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const { english, german } = splitConversationTopic(item.topic);
          const level = item.levels?.level;
          const levelColor = level ? LEVEL_COLORS[level] : undefined;

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => router.push(`/conversation/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.levelBadge,
                    { backgroundColor: levelColor ?? "#6366F1" },
                  ]}
                >
                  <Text style={styles.levelBadgeText}>{level ?? "General"}</Text>
                </View>
                <MaterialCommunityIcons
                  name="message-text-outline"
                  size={18}
                  color={isDark ? "#94A3B8" : "#9CA3AF"}
                />
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>
                {english}
              </Text>
              {Boolean(german) && (
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  {german}
                </Text>
              )}

              <Text style={styles.cardCta}>Practice this dialogue →</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No conversation topics yet.</Text>
        }
      />
    </View>
  );
}

const createStyles = (isDark: boolean) => {
  const bg = isDark ? "#020617" : "#FFFFFF";
  const cardBg = isDark ? "#0f172a" : "#F9F9F9";
  const textPrimary = isDark ? "#F1F5F9" : "#1F2937";
  const textMuted = isDark ? "#94A3B8" : "#6B7280";
  const chipBg = isDark ? "#1e293b" : "#F1F5F9";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg, padding: 16 },
    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: bg,
    },
    subtitle: { fontSize: 13, color: textMuted, marginBottom: 14, textAlign: "center" },
    errorText: { fontSize: 13, color: "#F87171", marginBottom: 10 },
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
    chipActive: { backgroundColor: "#6366F1" },
    chipText: { fontSize: 12, fontWeight: "600", color: textMuted },
    chipTextActive: { color: "#FFFFFF" },
    listContent: { paddingBottom: 20 },
    row: { gap: 12 },
    card: {
      flex: 1,
      backgroundColor: cardBg,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      minHeight: 140,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    levelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    levelBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
    cardTitle: { fontSize: 14, fontWeight: "700", color: textPrimary, marginBottom: 4 },
    cardSubtitle: {
      fontSize: 12,
      fontStyle: "italic",
      color: "#0D9488",
      marginBottom: 10,
    },
    cardCta: { fontSize: 11, fontWeight: "600", color: "#6366F1", marginTop: "auto" },
    emptyText: {
      fontSize: 14,
      color: textMuted,
      textAlign: "center",
      marginTop: 40,
    },
  });
};
