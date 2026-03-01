import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "../../../src/hooks/useAppHooks";
import { fetchWord } from "../../../src/redux/wordsSlice";

export default function WordDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Word Details
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Word Title */}
      <View style={styles.wordSection}>
        <Text style={styles.wordTitle}>{currentWord.value}</Text>
        {currentWord.partOfSpeech && (
          <Text style={styles.posTag}>{currentWord.partOfSpeech}</Text>
        )}
      </View>

      {/* Meaning */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meaning</Text>
        <Text style={styles.meaningText}>{currentWord.meaning}</Text>
      </View>

      {/* Example (if available) */}
      {currentWord.example && (
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  errorText: {
    fontSize: 16,
    color: "#FF6B6B",
    marginTop: 12,
    textAlign: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#666666",
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  wordSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#F9F9F9",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  wordTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
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
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  meaningText: {
    fontSize: 16,
    color: "#444444",
    lineHeight: 24,
  },
  exampleText: {
    fontSize: 14,
    color: "#555555",
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
    backgroundColor: "#E8F5E9",
    color: "#2E7D32",
  },
  difficultyIntermediate: {
    backgroundColor: "#FFF3E0",
    color: "#F57C00",
  },
  difficultyAdvanced: {
    backgroundColor: "#FFEBEE",
    color: "#C62828",
  },
  infoText: {
    fontSize: 15,
    color: "#444444",
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  gridItem: {
    alignItems: "center",
    gap: 8,
  },
  gridLabel: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "500",
  },
});
