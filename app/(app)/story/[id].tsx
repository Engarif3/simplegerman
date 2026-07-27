import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useAppDispatch, useAppSelector } from "../../../src/hooks/useAppHooks";
import { fetchStory } from "../../../src/redux/storiesSlice";

const handlePronounce = (word: string) => {
  if (Platform.OS === "web") {
    const utterance = new (window as any).SpeechSynthesisUtterance(word);
    utterance.lang = "de-DE";
    (window as any).speechSynthesis.cancel();
    (window as any).speechSynthesis.speak(utterance);
  } else {
    Speech.speak(word, { language: "de-DE", pitch: 1.0, rate: 0.8 });
  }
};

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
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  // Natural height/width ratio of the loaded image — used to size the box
  // to the image's own aspect ratio (matching web's `w-full` + auto height),
  // instead of a fixed height that crops every image the same way
  // regardless of its actual shape.
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    if (id) {
      console.log("[StoryDetail] Fetching story:", id);
      dispatch(fetchStory(id as string));
    }
  }, [id, dispatch]);

  useEffect(() => {
    setImageAspectRatio(null);
    if (!currentStory?.image) return;
    Image.getSize(
      currentStory.image,
      (width, height) => setImageAspectRatio(height / width),
      () => setImageAspectRatio(null),
    );
  }, [currentStory?.image]);

  useEffect(() => {
    if (currentStory) {
      console.log("[StoryDetail] Story loaded:", {
        id: currentStory.id,
        title: currentStory.title,
        hasImage: !!currentStory.image,
        imageUrl: currentStory.image,
        description: currentStory.description?.substring(0, 50) + "...",
        vocabularyCount: currentStory.vocabulary?.length || 0,
        levelName: currentStory.level?.level,
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
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
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
      {Boolean(currentStory.level?.level) && (
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{currentStory.level.level}</Text>
        </View>
      )}

      {/* Story Image — sized to the image's own aspect ratio (capped at
          420, matching web's `w-full` + `max-height:420` + `object-cover`)
          instead of a fixed height that cropped every image regardless of
          its actual shape. */}
      {Boolean(currentStory.image) && (
        <Image
          source={{ uri: currentStory.image }}
          style={[
            styles.storyImage,
            {
              height: imageAspectRatio
                ? Math.min(420, (windowWidth - 32) * imageAspectRatio)
                : 220,
            },
          ]}
          resizeMode="cover"
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

      {/* Vocabulary Section — matches web's StoryDetail.jsx: only
          story.vocabulary is shown there (passageVocabulary is a separate,
          unused-on-this-screen field), each row is a speaker button + word
          + arrow + meaning. */}
      {Boolean(currentStory.vocabulary?.length) && (
        <View style={styles.vocabSection}>
          <Text style={styles.vocabTitle}>Vocabulary</Text>
          <View style={styles.vocabList}>
            {currentStory.vocabulary.map((vocab, index) => (
              <View key={index} style={styles.vocabItem}>
                <TouchableOpacity
                  style={styles.vocabSpeaker}
                  onPress={() => handlePronounce(vocab.word)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.vocabSpeakerEmoji}>🔊</Text>
                </TouchableOpacity>
                <Text style={styles.vocabWord}>{vocab.word}</Text>
                <Text style={styles.vocabMeaning}>
                  <Text style={styles.vocabArrow}> → </Text>
                  {vocab.meaning}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Metadata */}
      <View style={styles.metadata}>
        {Boolean(currentStory.creator?.name) && (
          <Text style={styles.metaText}>By: {currentStory.creator.name}</Text>
        )}
        {Boolean(currentStory.createdAt) && (
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
    borderRadius: 12,
    marginBottom: 20,
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
  },
  vocabSpeaker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  vocabSpeakerEmoji: { fontSize: 18 },
  vocabWord: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2196F3",
  },
  vocabMeaning: {
    flex: 1,
    fontSize: 13,
    color: "#666666",
  },
  vocabArrow: {
    color: "#F97316",
    fontWeight: "700",
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
