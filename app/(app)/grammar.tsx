import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/context/ThemeContext";
import ScreenHeader from "../../src/components/ScreenHeader";

const GRAMMAR_TOPICS = [
  { route: "/grammar/clauses", title: "Clauses", icon: "🔗", desc: "Coordinating, subordinating & more" },
  { route: "/grammar/passive-voice", title: "Passive Voice", icon: "🔄", desc: "The passive construction" },
  { route: "/grammar/verb-preposition", title: "Verb with Preposition", icon: "⚙️", desc: "Verbs paired with fixed prepositions" },
  { route: "/grammar/adjective-preposition", title: "Adjective with Preposition", icon: "🎨", desc: "Adjectives paired with fixed prepositions" },
  { route: "/grammar/perfect-past", title: "Perfekt & Präteritum", icon: "⏳", desc: "Irregular verb forms by pattern" },
  { route: "/grammar/verbs-gehen", title: "Verbs ending in \"-gehen\"", icon: "🚶", desc: "Present, past, perfect & modal forms" },
] as const;

export default function GrammarHubScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <ScreenHeader title="Grammar" />
      <Text style={styles.eyebrow}>📐 RULE SYSTEM</Text>
      <Text style={styles.subtitle}>Master German grammar rules, topic by topic</Text>

      {GRAMMAR_TOPICS.map((topic, index) => (
        <TouchableOpacity
          key={topic.route}
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => router.push(topic.route)}
        >
          <View style={styles.indexBadge}>
            <Text style={styles.indexBadgeText}>{index + 1}</Text>
          </View>
          <Text style={styles.cardIcon}>{topic.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{topic.title}</Text>
            <Text style={styles.cardDesc}>{topic.desc}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const createStyles = (isDark: boolean) => {
  const bg = isDark ? "#020617" : "#FFFFFF";
  const cardBg = isDark ? "#0f172a" : "#F9F9F9";
  const textPrimary = isDark ? "#F1F5F9" : "#1F2937";
  const textMuted = isDark ? "#94A3B8" : "#6B7280";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg, padding: 16 },
    eyebrow: {
      fontSize: 11,
      fontWeight: "700",
      color: "#8B5CF6",
      textAlign: "center",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 13,
      color: textMuted,
      textAlign: "center",
      marginBottom: 20,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: cardBg,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      gap: 12,
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
    cardIcon: { fontSize: 26 },
    cardTitle: { fontSize: 15, fontWeight: "700", color: textPrimary },
    cardDesc: { fontSize: 12, color: textMuted, marginTop: 2 },
  });
};
