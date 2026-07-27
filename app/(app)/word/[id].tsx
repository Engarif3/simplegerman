import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "../../../src/hooks/useAppHooks";
import { fetchWord } from "../../../src/redux/wordsSlice";
import { useTheme } from "../../../src/context/ThemeContext";
import { renderWordWithPrefix } from "../../../src/utils/wordPrefixHighlight";

export default function WordDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { currentWord, isLoading, error } = useAppSelector(
    (state) => state.words,
  );

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    if (id) {
      console.log("[WordDetail] Fetching word:", id);
      dispatch(fetchWord(id as string));
    }
  }, [id, dispatch]);

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (isLoading || !currentWord) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading word details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={theme === "dark" ? "#F1F5F9" : "#333"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Word Details
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Word Title */}
      <View style={styles.wordSection}>
        {renderWordWithPrefix(currentWord, styles.wordTitle, styles.wordPrefix)}
        {Boolean(currentWord.partOfSpeech?.name) && (
          <Text style={styles.posTag}>{currentWord.partOfSpeech?.name}</Text>
        )}
      </View>

      {/* Meaning */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meaning</Text>
        <Text style={styles.meaningText}>{currentWord.meaning}</Text>
      </View>

      {/* Example (if available) */}
      {Boolean(currentWord.example) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Example</Text>
          <Text style={styles.exampleText}>{currentWord.example}</Text>
        </View>
      )}

      {/* Difficulty Level */}
      {currentWord.difficulty && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Difficulty Level</Text>
          <View style={styles.difficultyBadge}>
            <Text
              style={[
                styles.difficultyText,
                currentWord.difficulty === "BEGINNER" &&
                  styles.difficultyBeginner,
                currentWord.difficulty === "INTERMEDIATE" &&
                  styles.difficultyIntermediate,
                currentWord.difficulty === "ADVANCED" &&
                  styles.difficultyAdvanced,
              ]}
            >
              {currentWord.difficulty}
            </Text>
          </View>
        </View>
      )}

      {/* Level Information */}
      {currentWord.level && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Level</Text>
          <Text style={styles.infoText}>{currentWord.level.name}</Text>
        </View>
      )}

      {/* Topic Information */}
      {currentWord.topic && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Topic</Text>
          <Text style={styles.infoText}>{currentWord.topic.name}</Text>
        </View>
      )}

      {/* Word Details Grid */}
      <View style={styles.infoGrid}>
        <View style={styles.gridItem}>
          <MaterialCommunityIcons name="language-c" size={24} color="#FF6B6B" />
          <Text style={styles.gridLabel}>German</Text>
        </View>
        <View style={styles.gridItem}>
          <MaterialCommunityIcons name="translate" size={24} color="#FF6B6B" />
          <Text style={styles.gridLabel}>Translation</Text>
        </View>
        <View style={styles.gridItem}>
          <MaterialCommunityIcons
            name="book-outline"
            size={24}
            color="#FF6B6B"
          />
          <Text style={styles.gridLabel}>Learning</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: "light" | "dark") => {
  const isDark = theme === "dark";
  const bg = isDark ? "#020617" : "#FFFFFF";
  const cardBg = isDark ? "#0f172a" : "#F9F9F9";
  const border = isDark ? "#1e293b" : "#EEEEEE";
  const textPrimary = isDark ? "#F1F5F9" : "#333333";
  const textSecondary = isDark ? "#CBD5E1" : "#444444";
  const textMuted = isDark ? "#94A3B8" : "#666666";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: bg,
    },
    errorText: {
      fontSize: 16,
      color: "#FF6B6B",
      marginTop: 12,
      textAlign: "center",
    },
    loadingText: {
      fontSize: 14,
      color: textMuted,
      marginTop: 12,
    },
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
      fontSize: 16,
      fontWeight: "600",
      color: textPrimary,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 12,
    },
    wordSection: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      backgroundColor: cardBg,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    wordTitle: {
      fontSize: 32,
      fontWeight: "700",
      color: textPrimary,
      marginBottom: 8,
    },
    wordPrefix: {
      color: "#F97316",
      fontWeight: "700",
    },
    posTag: {
      fontSize: 12,
      fontWeight: "600",
      color: "#FF6B6B",
      textTransform: "uppercase",
    },
    card: {
      marginHorizontal: 16,
      marginVertical: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: cardBg,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: "#FF6B6B",
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: textPrimary,
      marginBottom: 8,
      textTransform: "uppercase",
    },
    meaningText: {
      fontSize: 16,
      color: textSecondary,
      lineHeight: 24,
    },
    exampleText: {
      fontSize: 14,
      color: textSecondary,
      lineHeight: 22,
      fontStyle: "italic",
    },
    difficultyBadge: {
      marginTop: 8,
    },
    difficultyText: {
      fontSize: 13,
      fontWeight: "700",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    difficultyBeginner: {
      backgroundColor: isDark ? "#14532d" : "#E8F5E9",
      color: isDark ? "#86EFAC" : "#2E7D32",
    },
    difficultyIntermediate: {
      backgroundColor: isDark ? "#7c2d12" : "#FFF3E0",
      color: isDark ? "#FDBA74" : "#F57C00",
    },
    difficultyAdvanced: {
      backgroundColor: isDark ? "#7f1d1d" : "#FFEBEE",
      color: isDark ? "#FCA5A5" : "#C62828",
    },
    infoText: {
      fontSize: 15,
      color: textSecondary,
    },
    infoGrid: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: 16,
      paddingVertical: 24,
      borderTopWidth: 1,
      borderTopColor: border,
    },
    gridItem: {
      alignItems: "center",
      gap: 8,
    },
    gridLabel: {
      fontSize: 12,
      color: textMuted,
      fontWeight: "500",
    },
  });
};
