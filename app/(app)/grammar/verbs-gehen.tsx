import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../../src/context/ThemeContext";
import verbsGehenData from "../../../src/data/grammar/verbsWithGehen.json";
import type { GehenVerb } from "../../../src/data/grammar/types";

const WORDS = (verbsGehenData as { words: GehenVerb[] }).words;

export default function VerbsWithGehenScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={isDark ? "#F1F5F9" : "#333"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verbs ending in "-gehen"</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.wordBank}>
        {WORDS.map((verb) => (
          <View key={verb.word} style={styles.wordChip}>
            <Text style={styles.wordChipText}>{verb.word}</Text>
          </View>
        ))}
      </View>

      {WORDS.map((verb) => (
        <View key={verb.word} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.wordText}>{verb.word}</Text>
            <Text style={styles.meaningText}>{verb.meaning}</Text>
          </View>
          <View style={styles.sentenceRow}>
            <Text style={styles.sentenceLabel}>Präsens</Text>
            <Text style={styles.sentenceText}>{verb.sentences.present}</Text>
          </View>
          <View style={styles.sentenceRow}>
            <Text style={styles.sentenceLabel}>Präteritum</Text>
            <Text style={styles.sentenceText}>{verb.sentences.past}</Text>
          </View>
          <View style={styles.sentenceRow}>
            <Text style={styles.sentenceLabel}>Perfekt</Text>
            <Text style={styles.sentenceText}>{verb.sentences.perfect}</Text>
          </View>
          <View style={styles.sentenceRow}>
            <Text style={styles.sentenceLabel}>Modal</Text>
            <Text style={styles.sentenceText}>{verb.sentences.modal}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const createStyles = (isDark: boolean) => {
  const bg = isDark ? "#020617" : "#FFFFFF";
  const cardBg = isDark ? "#0f172a" : "#F9F9F9";
  const chipBg = isDark ? "#1e293b" : "#F1F5F9";
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
    headerTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: textPrimary,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 8,
    },
    wordBank: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 20,
    },
    wordChip: {
      backgroundColor: chipBg,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
    },
    wordChipText: { fontSize: 11, fontWeight: "600", color: textPrimary },
    card: {
      backgroundColor: cardBg,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
    },
    cardHeader: { marginBottom: 8 },
    wordText: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#60A5FA" : "#2563EB",
    },
    meaningText: { fontSize: 12, fontStyle: "italic", color: textMuted, marginTop: 2 },
    sentenceRow: { marginBottom: 6 },
    sentenceLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: "#10B981",
      textTransform: "uppercase",
      marginBottom: 2,
    },
    sentenceText: { fontSize: 13, color: textPrimary, lineHeight: 18 },
  });
};
