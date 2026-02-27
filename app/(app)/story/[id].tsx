import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "../../../src/hooks/useAppHooks";
import { fetchStory } from "../../../src/redux/storiesSlice";

// Helper function to split text into paragraphs
const splitIntoParagraphs = (text: string): string[] => {
  if (!text) return [];

  // Check if text already has paragraph breaks
  if (text.includes("\n\n")) {
    return text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  }

  // If no paragraph breaks, intelligently split by sentences
  const sentences = [];
  let currentSentence = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    currentSentence += char;

    if ((char === "." || char === "!" || char === "?") && i + 1 < text.length) {
      const prevChar = text[i - 1];
      const nextChar = text[i + 1];
      const charAfterSpace = text[i + 2];
      const isDateFormat = /\d/.test(prevChar);

      if (
        !isDateFormat &&
        nextChar === " " &&
        charAfterSpace &&
        /[A-ZÄÖÜ]/.test(charAfterSpace)
      ) {
        sentences.push(currentSentence.trim());
        currentSentence = "";
        i += 1;
      }
    }
  }

  if (currentSentence.trim()) {
    sentences.push(currentSentence.trim());
  }

  if (sentences.length < 4) {
    return text.trim().length > 0 ? [text.trim()] : [];
  }

  const paragraphs = [];
  let currentParagraph = "";
  const sentencesPerParagraph = Math.ceil(sentences.length / 4);

  sentences.forEach((sentence, idx) => {
    currentParagraph += sentence;
    if (
      (idx + 1) % sentencesPerParagraph === 0 ||
      idx === sentences.length - 1
    ) {
      if (currentParagraph.trim()) {
        paragraphs.push(currentParagraph.trim());
      }
      currentParagraph = "";
    } else {
      currentParagraph += " ";
    }
  });

  return paragraphs.filter((p) => p.trim().length > 0);
};

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentStory, isLoading, error } = useAppSelector(
    (state) => state.stories,
  );

  useEffect(() => {
    if (id) {
      console.log("[StoryDetail] Fetching story:", id);
      dispatch(fetchStory(id as string));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (currentStory) {
      console.log("[StoryDetail] Story loaded:", {
        id: currentStory.id,
        title: currentStory.title,
        hasImage: !!currentStory.image,
        imageUrl: currentStory.image,
        description: currentStory.description?.substring(0, 50) + "...",
        vocabularyCount: currentStory.vocabulary?.length || 0,
        levelName: currentStory.level?.name,
        creatorName: currentStory.creator?.name,
      });
    }
  }, [currentStory]);

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading story: {error}</Text>
      </View>
    );
  }

  if (isLoading || !currentStory) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading story...</Text>
      </View>
    );
  }

  const descriptionParagraphs = splitIntoParagraphs(currentStory.description);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentStory.title}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Story Title */}
      <Text style={styles.title}>{currentStory.title}</Text>

      {/* Level Badge */}
      {currentStory.level?.name && (
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{currentStory.level.name}</Text>
        </View>
      )}

      {/* Story Image */}
      {currentStory.image && (
        <Image
          source={{ uri: currentStory.image }}
          style={styles.storyImage}
          onLoadStart={() =>
            console.log("[StoryImage] Loading:", currentStory.image)
          }
          onLoad={() => console.log("[StoryImage] Loaded successfully")}
          onError={(e) =>
            console.log("[StoryImage] Error loading:", e.nativeEvent)
          }
        />
      )}

      {/* Story Description - Split into Paragraphs */}
      {descriptionParagraphs.length > 0 && (
        <View style={styles.descriptionContainer}>
          {descriptionParagraphs.map((paragraph, idx) => (
            <Text key={idx} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      )}

      {/* Vocabulary Section - Show passageVocabulary or vocabulary */}
      {currentStory.passageVocabulary?.length ||
      currentStory.vocabulary?.length ? (
        <View style={styles.vocabSection}>
          <Text style={styles.vocabTitle}>Vocabulary</Text>
          <View style={styles.vocabList}>
            {(currentStory.passageVocabulary?.length
              ? currentStory.passageVocabulary
              : currentStory.vocabulary
            ).map((vocab, index) => (
              <View key={index} style={styles.vocabItem}>
                <Text style={styles.vocabWord}>{vocab.word}</Text>
                <Text style={styles.vocabMeaning}>→ {vocab.meaning}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Metadata */}
      <View style={styles.metadata}>
        {currentStory.creator?.name && (
          <Text style={styles.metaText}>By: {currentStory.creator.name}</Text>
        )}
        {currentStory.createdAt && (
          <Text style={styles.metaText}>
            Created: {new Date(currentStory.createdAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
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
    paddingVertical: 12,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 12,
    textAlign: "center",
  },
  levelBadge: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "center",
    marginBottom: 16,
  },
  levelText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  storyImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
    resizeMode: "cover",
  },
  descriptionContainer: {
    backgroundColor: "#F9F9F9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444444",
    marginBottom: 12,
    textAlign: "justify",
  },
  vocabSection: {
    marginBottom: 24,
    paddingBottom: 16,
  },
  vocabTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  vocabList: {
    gap: 8,
  },
  vocabItem: {
    backgroundColor: "#F9F9F9",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FF6B6B",
  },
  vocabWord: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2196F3",
    marginBottom: 4,
  },
  vocabMeaning: {
    fontSize: 13,
    color: "#666666",
  },
  metadata: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 4,
  },
});
