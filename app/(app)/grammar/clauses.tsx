import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useEffect } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../../src/context/ThemeContext";

const CLAUSE_TYPES = [
  { type: "coordinating", title: "Coordinating Clauses", desc: "und, oder, aber, denn…" },
  { type: "subordinating", title: "Subordinating Clauses", desc: "weil, dass, wenn, obwohl…" },
  { type: "conjunctive", title: "Conjunctive Adverbs", desc: "deshalb, trotzdem, außerdem…" },
  { type: "other", title: "Others", desc: "Prepositions acting as connectors" },
] as const;

export default function ClausesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

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
        <Text style={styles.headerTitle}>Clauses</Text>
        <View style={{ width: 28 }} />
      </View>

      {CLAUSE_TYPES.map((clause, index) => (
        <TouchableOpacity
          key={clause.type}
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => router.push(`/grammar/clause/${clause.type}`)}
        >
          <View style={styles.indexBadge}>
            <Text style={styles.indexBadgeText}>{index + 1}</Text>
          </View>
          <Text style={styles.cardTitle}>{clause.title}</Text>
          <Text style={styles.cardDesc}>{clause.desc}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const createStyles = (isDark: boolean) => {
  const bg = isDark ? "#020617" : "#FFFFFF";
  const cardBg = isDark ? "#0f172a" : "#F9F9F9";
  const textPrimary = isDark ? "#F1F5F9" : "#1F2937";
  const textMuted = isDark ? "#94A3B8" : "#6B7280";
  const border = isDark ? "#1e293b" : "#EEEEEE";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg, paddingHorizontal: 16 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    headerTitle: { fontSize: 17, fontWeight: "700", color: textPrimary },
    card: {
      backgroundColor: cardBg,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
    },
    indexBadge: {
      position: "absolute",
      top: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#8B5CF6",
      alignItems: "center",
      justifyContent: "center",
    },
    indexBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
    cardTitle: { fontSize: 15, fontWeight: "700", color: textPrimary, marginBottom: 4 },
    cardDesc: { fontSize: 12, color: textMuted },
  });
};
