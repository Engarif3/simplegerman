import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import type { WordVocab } from "../services/wordService";

interface WordDetailModalProps {
  visible: boolean;
  word: WordVocab | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (wordId: string) => void;
  loadingFavorite?: boolean;
}

// Helper function to process sentences
function processSentence(sentence: string): {
  cleanSentence: string;
  isHeading: boolean;
  isDescription: boolean;
  showSpeaker: boolean;
} {
  const trimmed = sentence.trim();
  let cleanSentence = sentence;
  let isHeading = false;
  let isDescription = false;

  if (trimmed.startsWith("##")) {
    isHeading = true;
    cleanSentence = sentence.replace(/^##\s*/, "");
  } else if (trimmed.startsWith("**")) {
    isDescription = true;
    cleanSentence = sentence
      .replace(/^\*\*\s*/, "🟣 ")
      .replace(/\*\*$/, "")
      .trim();
  }

  const showSpeaker = !trimmed.startsWith("##") && !trimmed.startsWith("**");

  return { cleanSentence, isHeading, isDescription, showSpeaker };
}

export default function WordDetailModal({
  visible,
  word,
  onClose,
  isFavorite,
  onToggleFavorite,
  loadingFavorite = false,
}: WordDetailModalProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  // Pronunciation handler - MUST be before early return
  const handlePronounce = useCallback((text: string, index?: number) => {
    if (index !== undefined) {
      setPlayingIndex(index);
    }

    if (Platform.OS === "web") {
      // Web: Use Web Speech API
      const utterance = new (window as any).SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE";
      utterance.pitch = 1.0;
      utterance.rate = 0.8;
      utterance.onend = () => {
        if (index !== undefined) {
          setPlayingIndex(null);
        }
      };
      (window as any).speechSynthesis.cancel();
      (window as any).speechSynthesis.speak(utterance);
    } else {
      // Native: Use expo-speech
      Speech.speak(text, {
        language: "de-DE",
        pitch: 1.0,
        rate: 0.8,
        onDone: () => {
          if (index !== undefined) {
            setPlayingIndex(null);
          }
        },
      });
    }
  }, []);

  const handleToggleFavorite = useCallback(() => {
    if (!word) return;
    onToggleFavorite(word.id);
  }, [word, onToggleFavorite]);

  // Handle article - extract name property
  const articleName = useMemo(() => {
    if (!word?.article) return "";
    if (typeof word.article === "string") {
      return String(word.article || "").trim();
    }
    if (typeof word.article === "object" && word.article) {
      const artObj = word.article as any;
      return String(artObj.name || artObj.value || "").trim();
    }
    return "";
  }, [word?.article]);

  // Handle meanings
  const meaningText = useMemo(() => {
    if (!word) return "";
    if (Array.isArray(word.meaning)) {
      return word.meaning.filter((m) => m && String(m).trim()).join(", ");
    }
    return String(word.meaning || "").trim() || "No meaning";
  }, [word?.meaning]);

  // Handle sentences - process them to remove markers
  const processedSentences = useMemo(() => {
    if (!word?.sentences || !Array.isArray(word.sentences)) return [];
    return word.sentences.map((sentence: string) => ({
      original: sentence,
      ...processSentence(String(sentence || "")),
    }));
  }, [word?.sentences]);

  // Handle synonyms with proper article extraction
  const synonyms = useMemo(() => {
    if (!word?.synonyms || !Array.isArray(word.synonyms)) return [];
    return word.synonyms.map((item: any) => {
      let article = "";
      if (item.article) {
        if (typeof item.article === "string") {
          article = String(item.article || "").trim();
        } else if (typeof item.article === "object") {
          const artObj = item.article as any;
          article = String(artObj.name || artObj.value || "").trim();
        }
      }
      return {
        article,
        value: String(item.value || ""),
      };
    });
  }, [word?.synonyms]);

  // Handle antonyms with proper article extraction
  const antonyms = useMemo(() => {
    if (!word?.antonyms || !Array.isArray(word.antonyms)) return [];
    return word.antonyms.map((item: any) => {
      let article = "";
      if (item.article) {
        if (typeof item.article === "string") {
          article = String(item.article || "").trim();
        } else if (typeof item.article === "object") {
          const artObj = item.article as any;
          article = String(artObj.name || artObj.value || "").trim();
        }
      }
      return {
        article,
        value: String(item.value || ""),
      };
    });
  }, [word?.antonyms]);

  // Handle similar words with proper article extraction
  const similarWords = useMemo(() => {
    if (!word?.similarWords || !Array.isArray(word.similarWords)) return [];
    return word.similarWords.map((item: any) => {
      let article = "";
      if (item.article) {
        if (typeof item.article === "string") {
          article = String(item.article || "").trim();
        } else if (typeof item.article === "object") {
          const artObj = item.article as any;
          article = String(artObj.name || artObj.value || "").trim();
        }
      }
      return {
        article,
        value: String(item.value || ""),
      };
    });
  }, [word?.similarWords]);

  // Early return AFTER all hooks
  if (!visible || !word) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color="#333"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Word Details</Text>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
            disabled={loadingFavorite}
          >
            {loadingFavorite ? (
              <ActivityIndicator size="small" color="#FF6B6B" />
            ) : (
              <MaterialCommunityIcons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? "#FF6B6B" : "#CCC"}
              />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Topic Section */}
          {word.topic && (
            <View style={styles.topicSection}>
              <Text style={styles.topicLabel}>Topic:</Text>
              <Text style={styles.topicName}>
                {String(word.topic.name || "")}
              </Text>
            </View>
          )}

          {/* Word Title Section */}
          <View style={styles.wordSection}>
            <View style={styles.wordHeader}>
              <View style={styles.wordTitleContainer}>
                {articleName && (
                  <Text style={styles.article}>{articleName}</Text>
                )}
                <Text style={styles.wordTitle}>{String(word.value || "")}</Text>
              </View>
              <TouchableOpacity
                style={styles.wordSpeaker}
                onPress={() => handlePronounce(word.value || "")}
                activeOpacity={0.6}
              >
                <Text style={styles.speakerEmoji}>🔊</Text>
              </TouchableOpacity>
            </View>
            {meaningText && <Text style={styles.meaning}>{meaningText}</Text>}
          </View>

          <View style={styles.divider} />

          {/* Details Grid */}
          <View style={styles.detailsContainer}>
            {/* Left Column */}
            <View style={styles.leftColumn}>
              {/* Plural Form */}
              {word.pluralForm && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Plural:</Text>
                  <View style={styles.pluralContent}>
                    <Text style={styles.pluralArticle}>die</Text>
                    <Text style={styles.pluralWord}>
                      {String(word.pluralForm || "")}
                    </Text>
                  </View>
                </View>
              )}

              {/* Level */}
              {word.level && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Level:</Text>
                  <Text style={styles.levelText}>
                    {String(word.level.level || word.level.name || "")}
                  </Text>
                </View>
              )}

              {/* Difficulty */}
              {word.difficulty && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Difficulty:</Text>
                  <View
                    style={[
                      styles.difficultyBadge,
                      word.difficulty === "BEGINNER" &&
                        styles.difficultyBeginner,
                      word.difficulty === "INTERMEDIATE" &&
                        styles.difficultyIntermediate,
                      word.difficulty === "ADVANCED" &&
                        styles.difficultyAdvanced,
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        word.difficulty === "BEGINNER" &&
                          styles.difficultyBeginnerText,
                        word.difficulty === "INTERMEDIATE" &&
                          styles.difficultyIntermediateText,
                        word.difficulty === "ADVANCED" &&
                          styles.difficultyAdvancedText,
                      ]}
                    >
                      {String(word.difficulty || "")}
                    </Text>
                  </View>
                </View>
              )}

              {/* Synonyms */}
              {synonyms.length > 0 && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Synonyms:</Text>
                  <View style={styles.wordsList}>
                    {synonyms.map((item, idx) => (
                      <View key={idx} style={styles.wordItemRow}>
                        {item.article && (
                          <Text style={styles.itemArticle}>{item.article}</Text>
                        )}
                        <Text style={styles.itemValue}>{item.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Antonyms */}
              {antonyms.length > 0 && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Antonyms:</Text>
                  <View style={styles.wordsList}>
                    {antonyms.map((item, idx) => (
                      <View key={idx} style={styles.wordItemRow}>
                        {item.article && (
                          <Text style={styles.itemArticle}>{item.article}</Text>
                        )}
                        <Text style={styles.itemValue}>{item.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Words to Watch */}
              {similarWords.length > 0 && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Word to Watch:</Text>
                  <View style={styles.wordsList}>
                    {similarWords.map((item, idx) => (
                      <View key={idx} style={styles.wordItemRow}>
                        {item.article && (
                          <Text style={styles.itemArticle}>{item.article}</Text>
                        )}
                        <Text style={styles.itemValue}>{item.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Right Column - Sentences */}
            {processedSentences.length > 0 && (
              <View style={styles.rightColumn}>
                <Text style={styles.sentencesTitle}>📝 Sentences:</Text>
                <View style={styles.sentencesList}>
                  {processedSentences.map((item, idx) => (
                    <View key={idx} style={styles.sentenceItem}>
                      {/* Speaker button for regular sentences */}
                      {item.showSpeaker && (
                        <TouchableOpacity
                          style={styles.sentenceSpeaker}
                          onPress={() =>
                            handlePronounce(item.cleanSentence, idx)
                          }
                          activeOpacity={0.6}
                        >
                          <Text
                            style={[
                              styles.speakerEmojiSmall,
                              playingIndex === idx && styles.speakerEmojiActive,
                            ]}
                          >
                            🔊
                          </Text>
                        </TouchableOpacity>
                      )}

                      {item.isHeading ? (
                        <Text style={styles.sentenceHeading}>
                          {item.cleanSentence}
                        </Text>
                      ) : item.isDescription ? (
                        <Text style={styles.sentenceDescription}>
                          {item.cleanSentence}
                        </Text>
                      ) : (
                        <Text style={styles.sentenceText}>
                          {item.cleanSentence}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Example */}
          {word.example && (
            <View style={styles.exampleSection}>
              <Text style={styles.detailLabel}>Example:</Text>
              <Text style={styles.exampleText}>
                {String(word.example || "")}
              </Text>
            </View>
          )}

          {/* Spacing */}
          <View style={{ height: 30 }} />
        </ScrollView>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialCommunityIcons
            name="close-circle"
            size={32}
            color="#FF6B6B"
          />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#FAFAFA",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  favoriteButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
  },
  topicSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF5E6",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "center",
  },
  topicLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF6B6B",
    marginBottom: 4,
  },
  topicName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#D97706",
  },
  wordSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#F9F9F9",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  wordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  wordTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  wordSpeaker: {
    padding: 8,
  },
  speakerEmoji: {
    fontSize: 28,
  },
  speakerEmojiSmall: {
    fontSize: 18,
    opacity: 0.7,
  },
  speakerEmojiActive: {
    opacity: 1,
    fontSize: 20,
  },
  article: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FF6B6B",
  },
  wordTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#333333",
    textTransform: "capitalize",
  },
  meaning: {
    fontSize: 14,
    color: "#555555",
    lineHeight: 22,
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 16,
    marginVertical: 16,
  },
  detailsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftColumn: {
    marginBottom: 16,
  },
  rightColumn: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  pluralContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pluralArticle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF6B6B",
  },
  pluralWord: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    textTransform: "capitalize",
  },
  levelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555555",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  difficultyBeginner: {
    backgroundColor: "#E8F5E9",
  },
  difficultyIntermediate: {
    backgroundColor: "#FFF3E0",
  },
  difficultyAdvanced: {
    backgroundColor: "#FFEBEE",
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "700",
  },
  difficultyBeginnerText: {
    color: "#2E7D32",
  },
  difficultyIntermediateText: {
    color: "#F57C00",
  },
  difficultyAdvancedText: {
    color: "#C62828",
  },
  wordsList: {
    gap: 6,
  },
  wordItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemArticle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF6B6B",
  },
  itemValue: {
    fontSize: 12,
    color: "#555555",
  },
  sentencesTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 12,
  },
  sentencesList: {
    gap: 8,
  },
  sentenceItem: {
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  sentenceSpeaker: {
    marginRight: 8,
    marginTop: 2,
    padding: 4,
  },
  sentenceHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#06B6D4",
    textAlign: "center",
    textDecorationLine: "underline",
    marginVertical: 8,
  },
  sentenceDescription: {
    fontSize: 12,
    color: "#666666",
    lineHeight: 18,
  },
  sentenceText: {
    fontSize: 13,
    color: "#555555",
    lineHeight: 20,
  },
  exampleSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9F9F9",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  exampleText: {
    fontSize: 13,
    color: "#555555",
    lineHeight: 20,
    fontStyle: "italic",
  },
  closeButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#FFF",
    borderRadius: 50,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
});
