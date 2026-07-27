import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useEffect } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import type { VerbPrepositionEntry, AdjectivePrepositionEntry } from "../data/grammar/types";

type Entry = VerbPrepositionEntry | AdjectivePrepositionEntry;

interface PrepositionSearchListProps {
  title: string;
  data: Entry[];
  fieldKey: "Verb" | "Adjective";
}

export default function PrepositionSearchList({
  title,
  data,
  fieldKey,
}: PrepositionSearchListProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return data;
    return data.filter((item) =>
      (item as any)[fieldKey]?.toLowerCase().includes(query),
    );
  }, [data, searchQuery, fieldKey]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={isDark ? "#F1F5F9" : "#333"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.searchBar}>
        <MaterialCommunityIcons
          name="magnify"
          size={18}
          color={isDark ? "#94A3B8" : "#9CA3AF"}
          style={{ marginRight: 6 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search by ${fieldKey.toLowerCase()}...`}
          placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item, index) => `${(item as any)[fieldKey]}-${index}`}
        contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 16 }}
        renderItem={({ item, index }) => {
          const entry = item as any;
          const showPronoun = entry.Pronoun && entry.Pronoun !== "-";
          return (
            <View
              style={[
                styles.card,
                index % 2 === 0 ? styles.cardEven : styles.cardOdd,
              ]}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.wordText}>
                  {showPronoun ? `${entry.Pronoun} ` : ""}
                  {entry[fieldKey]}
                </Text>
                <View style={styles.prepBadge}>
                  <Text style={styles.prepBadgeText}>
                    {entry.Preposition} · {entry.Kasus}
                  </Text>
                </View>
              </View>
              <Text style={styles.meaningText}>{entry.Meaning}</Text>
              <Text style={styles.exampleText}>{entry.Beispielsatz}</Text>
              <Text style={styles.translationText}>{entry.Übersetzung}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No matches found</Text>
        }
      />
    </View>
  );
}

const createStyles = (isDark: boolean) => {
  const bg = isDark ? "#020617" : "#FFFFFF";
  const cardBg = isDark ? "#0f172a" : "#F9F9F9";
  const rowOdd = isDark ? "#0b1220" : "#F3F4F6";
  const textPrimary = isDark ? "#F1F5F9" : "#1F2937";
  const textMuted = isDark ? "#94A3B8" : "#6B7280";
  const border = isDark ? "#1e293b" : "#EEEEEE";
  const inputBg = isDark ? "#0f172a" : "#F9F9F9";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    headerTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: textPrimary,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 8,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginVertical: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: inputBg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: border,
    },
    searchInput: { flex: 1, fontSize: 13, color: textPrimary },
    card: {
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
    },
    cardEven: { backgroundColor: cardBg },
    cardOdd: { backgroundColor: rowOdd },
    cardTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
      gap: 8,
    },
    wordText: {
      fontSize: 15,
      fontWeight: "700",
      color: isDark ? "#60A5FA" : "#2563EB",
      flexShrink: 1,
    },
    prepBadge: {
      backgroundColor: "#8B5CF6",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    prepBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
    meaningText: {
      fontSize: 12,
      color: isDark ? "#C4B5FD" : "#7C3AED",
      fontStyle: "italic",
      marginBottom: 6,
    },
    exampleText: { fontSize: 13, color: textPrimary, lineHeight: 19, marginBottom: 2 },
    translationText: { fontSize: 12, color: textMuted },
    emptyText: {
      fontSize: 14,
      color: textMuted,
      textAlign: "center",
      marginTop: 40,
    },
  });
};
