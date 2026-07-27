import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import * as Speech from "expo-speech";
import { useRouter } from "expo-router";
import { useAppSelector } from "../hooks/useAppHooks";
import { useTheme } from "../context/ThemeContext";
import type { WordVocab } from "../services/wordService";
import { renderWordWithPrefix } from "../utils/wordPrefixHighlight";
import {
  getArticleBadge,
  isVerbWord,
  ArticleBadgeTone,
} from "../utils/articleBadge";
import { paragraphService, GeneratedParagraph } from "../services/paragraphService";
import { conjugationService, ConjugationData } from "../services/conjugationService";
import AIParagraphModal from "./AIParagraphModal";
import ConjugationModal from "./ConjugationModal";
import ConfirmDialog from "./ConfirmDialog";

interface WordTableRowProps {
  word: WordVocab;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (wordId: string) => void;
  onPressWord: (word: WordVocab) => void;
  learningMode?: boolean;
  isRevealed?: boolean;
  onRevealToggle?: (wordId: string) => void;
}

// Noun articles (der/die/das/der-die) stay plain: orange italic text, no
// background — only the abbreviated part-of-speech badges (vrb./adj./etc.)
// get a colored pill background. Verb keeps its own background (sky-600,
// matching web) since it's an abbreviation like the others, not an article.
const ARTICLE_TEXT_COLOR = "#FB923C";
const BADGE_TONE_STYLES: Record<ArticleBadgeTone, { bg: string; text: string }> = {
  der: { bg: "transparent", text: ARTICLE_TEXT_COLOR },
  die: { bg: "transparent", text: ARTICLE_TEXT_COLOR },
  das: { bg: "transparent", text: ARTICLE_TEXT_COLOR },
  "der-die": { bg: "transparent", text: ARTICLE_TEXT_COLOR },
  article: { bg: "transparent", text: ARTICLE_TEXT_COLOR },
  verb: { bg: "#0284C7", text: "#FFFFFF" },
  adjective: { bg: "#000000", text: "#6EE7B7" },
  adverb: { bg: "#000000", text: "#C4B5FD" },
  "adjective-adverb": { bg: "#000000", text: "#F0ABFC" },
  preposition: { bg: "#000000", text: "#FDE68A" },
  conjunction: { bg: "#000000", text: "#FDA4AF" },
  phrase: { bg: "#000000", text: "#22D3EE" },
};

export default function WordTableRow({
  word,
  index,
  isFavorite,
  onToggleFavorite,
  onPressWord,
  learningMode = false,
  isRevealed = true,
  onRevealToggle,
}: WordTableRowProps) {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const isLoggedIn = !!user?.id;
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState<GeneratedParagraph | null>(null);
  const [aiLoginPromptOpen, setAiLoginPromptOpen] = useState(false);

  const [conjugationModalOpen, setConjugationModalOpen] = useState(false);
  const [conjugationLoading, setConjugationLoading] = useState(false);
  const [conjugationData, setConjugationData] = useState<ConjugationData | null>(null);
  const [conjugationError, setConjugationError] = useState<string | null>(null);

  // A normal tap on the word opens the detail modal; long-pressing it (or
  // tapping Meaning) expands that cell instead, so a truncated word or
  // meaning can be read in full without navigating away.
  const [isWordExpanded, setIsWordExpanded] = useState(false);
  const [isMeaningExpanded, setIsMeaningExpanded] = useState(false);

  const meaningText = Array.isArray(word.meaning)
    ? word.meaning.join(", ")
    : word.meaning || "No meaning";
  const articleName =
    typeof word.article === "string"
      ? word.article
      : word.article?.name || word.article?.value || "";
  const isVerb = isVerbWord(word);
  const badge = getArticleBadge(word);
  const badgeStyle = BADGE_TONE_STYLES[badge.tone];
  const isArticleTone = ["der", "die", "das", "der-die", "article"].includes(badge.tone);
  const isEvenRow = index % 2 === 0;

  const handlePronounce = () => {
    if (Platform.OS === "web") {
      const utterance = new (window as any).SpeechSynthesisUtterance(word.value);
      utterance.lang = "de-DE";
      utterance.pitch = 1.0;
      utterance.rate = 0.8;
      (window as any).speechSynthesis.cancel();
      (window as any).speechSynthesis.speak(utterance);
    } else {
      Speech.speak(word.value, { language: "de-DE", pitch: 1.0, rate: 0.8 });
    }
  };

  const handleGenerateAI = async () => {
    if (aiLoading) return;
    setAiModalOpen(true);
    setAiLoading(true);
    try {
      const result = await paragraphService.generate(word, user?.id);
      setAiData(result);
    } catch {
      setAiData({
        wordId: word.id,
        word: word.value,
        meanings: [],
        paragraph: "Could not generate a paragraph right now. Please try again.",
        sentences: [],
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleConjugate = async () => {
    if (conjugationLoading) return;
    setConjugationModalOpen(true);
    setConjugationLoading(true);
    setConjugationError(null);
    try {
      const result = await conjugationService.generate(word.value, word.id);
      setConjugationData(result);
    } catch {
      setConjugationData(null);
      setConjugationError("Please try again in a moment.");
    } finally {
      setConjugationLoading(false);
    }
  };

  return (
    <>
      <View style={[styles.wordRow, isEvenRow ? styles.rowEven : styles.rowOdd]}>
        {/* Article / part-of-speech badge — the whole column cell is the
            colored background (not just a small pill around the text). */}
        <View style={[styles.colArt, { backgroundColor: badgeStyle.bg }]}>
          <Text
            style={[
              styles.posBadgeText,
              { color: badgeStyle.text },
              isArticleTone && styles.articleTextItalic,
            ]}
            numberOfLines={1}
          >
            {badge.text}
          </Text>
        </View>

        {/* A single Touchable wraps just the word text, sized to hug its
            own content (not stretched to fill the column) — a normal tap
            opens the detail modal, a long-press expands/collapses it if
            the word is too long to show in full. This is deliberately one
            touchable with two gestures, not two overlapping touchables,
            since a wrapping "tap column" area plus a "tap text" area both
            claiming the same stretched space was opening the modal from
            anywhere in the column. */}
        <View style={styles.colWord}>
          <View style={styles.wordLine}>
            <TouchableOpacity
              style={styles.wordTouchable}
              activeOpacity={0.6}
              onPress={() => onPressWord(word)}
              onLongPress={() => setIsWordExpanded((prev) => !prev)}
            >
              {renderWordWithPrefix(
                word,
                [styles.cellText, styles.wordText],
                styles.wordPrefix,
                { numberOfLines: isWordExpanded ? undefined : 1 },
              )}
            </TouchableOpacity>

            <View style={styles.wordButtonsRow}>
              <TouchableOpacity onPress={handlePronounce} style={styles.speakerButton}>
                <Text style={styles.speakerEmoji}>🔊</Text>
              </TouchableOpacity>

              {isLoggedIn ? (
                <TouchableOpacity
                  onPress={handleGenerateAI}
                  disabled={aiLoading}
                  style={styles.aiButton}
                >
                  {aiLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.aiButtonText}>ai</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => setAiLoginPromptOpen(true)}
                  style={styles.aiButtonLocked}
                >
                  <Text style={styles.aiButtonText}>ai</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Tapping Meaning expands/collapses truncated text — it never
            opens the modal. In Learning Mode it keeps its existing
            reveal/hide behavior instead. */}
        <TouchableOpacity
          style={styles.colMeaning}
          activeOpacity={0.6}
          onPress={() =>
            learningMode
              ? onRevealToggle?.(word.id)
              : setIsMeaningExpanded((prev) => !prev)
          }
        >
          {learningMode ? (
            <Text
              style={[
                styles.cellText,
                styles.meaningText,
                { color: isRevealed ? undefined : "#AAAAAA" },
              ]}
              numberOfLines={1}
            >
              {isRevealed ? meaningText : "Click to reveal"}
            </Text>
          ) : (
            <Text
              style={[styles.cellText, styles.meaningText]}
              numberOfLines={isMeaningExpanded ? undefined : 1}
            >
              {meaningText}
            </Text>
          )}
        </TouchableOpacity>

        {/* Conjugate — verbs only, its own column (matches web: not
            stacked with the pronounce/AI buttons under the word) */}
        <View style={styles.colConjugate}>
          {isVerb ? (
            <TouchableOpacity
              onPress={handleConjugate}
              disabled={conjugationLoading}
              style={styles.conjugateButton}
            >
              {conjugationLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.conjugateButtonText}>C</Text>
              )}
            </TouchableOpacity>
          ) : (
            <Text style={[styles.cellText, styles.mutedDash]}>—</Text>
          )}
        </View>

        {/* Favorite */}
        <TouchableOpacity
          style={styles.colAction}
          onPress={() => onToggleFavorite(word.id)}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18 }}>{isFavorite ? "❤️" : "🤍"}</Text>
        </TouchableOpacity>
      </View>

      <AIParagraphModal
        visible={aiModalOpen}
        wordValue={word.value}
        article={articleName}
        meaning={meaningText}
        data={aiData}
        onClose={() => setAiModalOpen(false)}
      />

      <ConjugationModal
        visible={conjugationModalOpen}
        verb={word.value}
        meaning={meaningText}
        data={conjugationData}
        error={conjugationError}
        onClose={() => setConjugationModalOpen(false)}
      />

      <ConfirmDialog
        visible={aiLoginPromptOpen}
        title="Login to enjoy this feature"
        message="Sign in to generate AI-powered paragraphs."
        confirmLabel="Go to Login"
        cancelLabel="Cancel"
        onConfirm={() => {
          setAiLoginPromptOpen(false);
          router.push("/(auth)/login");
        }}
        onCancel={() => setAiLoginPromptOpen(false)}
      />
    </>
  );
}

const createStyles = (isDark: boolean) => {
  const textPrimary = isDark ? "#F1F5F9" : "#333333";
  const textMuted = isDark ? "#94A3B8" : "#666666";
  const rowEven = isDark ? "#0f172a" : "#FFFFFF";
  const rowOdd = isDark ? "#020617" : "#F9FAFB";
  const border = isDark ? "#1e293b" : "#EEEEEE";

  return StyleSheet.create({
    wordRow: {
      flexDirection: "row",
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: border,
      // Every column is single-line now (word + its buttons sit inline
      // instead of stacking), so a plain center alignment lines the POS
      // badge, word, speaker/AI/conjugate buttons, and favorite icon all
      // up on the same row.
      alignItems: "center",
      columnGap: 14,
    },
    rowEven: { backgroundColor: rowEven },
    rowOdd: { backgroundColor: rowOdd },

    // Column widths — mirrors web's own mobile breakpoint (WordTableRow.jsx
    // + WordList.jsx <th> widths). At that breakpoint web hides Level,
    // Synonyms, Antonyms, and Word-to-Watch entirely (hidden md:table-cell)
    // and gives Conjugate its own slim column rather than stacking it under
    // the word — normalizing web's mobile <th> widths (Article 5%, Word
    // 15%, Meaning 10%, Conjugate 3%, Favorite 3%) across only the columns
    // that actually show gives roughly Article 14%, Word 42%, Meaning 28%,
    // Conjugate/Favorite 8% each, which is what the flex values below mirror.
    // The visible gap between columns comes from wordRow's columnGap above,
    // not per-column margins, so header and rows always match exactly.
    // Every text style below shares the same lineHeight so their boxes are
    // the same height regardless of fontSize — without that, alignItems:
    // "center" centers each Text's own (differently-sized) box rather than
    // the glyphs themselves, which reads as slightly misaligned baselines.
    // Extra marginRight on top of wordRow's columnGap — just a bit more
    // breathing room between the POS badge and the word specifically.
    // alignSelf: "stretch" overrides wordRow's alignItems: "center" for just
    // this item, so the colored background fills the column's full height
    // (matching the row), not just a small pill hugging the text.
    colArt: {
      minWidth: 30,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
      alignSelf: "stretch",
      paddingHorizontal: 6,
      borderRadius: 8,
    },
    colWord: { flex: 3, alignItems: "flex-start" },
    colMeaning: { flex: 2, alignItems: "flex-start" },
    colConjugate: { width: 34, alignItems: "center" },
    colAction: { width: 28, alignItems: "center" },

    cellText: { fontSize: 12, fontWeight: "500", color: textPrimary, lineHeight: 18 },
    wordText: {
      color: isDark ? "#60A5FA" : "#2196F3",
      fontWeight: "700",
      fontSize: 14,
      lineHeight: 18,
    },
    // flexShrink (not flex:1) so this hugs the word's own content width and
    // only shrinks — never stretches — when the row is tight; that keeps
    // its tap target sized to the visible text instead of the whole column.
    wordTouchable: { flexShrink: 1 },
    wordPrefix: { color: "#F97316", fontWeight: "700" },
    meaningText: { color: isDark ? "#22D3EE" : "#00838F" },
    mutedDash: { color: textMuted },

    posBadgeText: { fontSize: 10, fontWeight: "700", lineHeight: 13 },
    articleTextItalic: { fontStyle: "italic", fontWeight: "700" },

    // Word text + its speaker/AI buttons on one line — the text takes
    // whatever space is left (and truncates) so the buttons always stay
    // pinned to the end of the Word column instead of crowding the text.
    wordLine: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
      width: "100%",
    },
    wordButtonsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexShrink: 0,
    },
    speakerButton: { padding: 2 },
    speakerEmoji: { fontSize: 15 },
    aiButton: {
      backgroundColor: "#10B981",
      borderRadius: 11,
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    aiButtonLocked: {
      backgroundColor: "#9CA3AF",
      borderRadius: 11,
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    aiButtonText: { color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
    conjugateButton: {
      backgroundColor: "#8B5CF6",
      borderRadius: 11,
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    conjugateButtonText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  });
};
