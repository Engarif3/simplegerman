import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../../src/context/ThemeContext";
import {
  conversationService,
  Conversation,
} from "../../../src/services/conversationService";
import { translateService } from "../../../src/services/translateService";
import { splitConversationTopic } from "../../../src/utils/splitConversationTopic";

// Stable per-speaker visual identity, assigned by order of first appearance
// — cycles through this palette, independent of which side a turn renders
// on (mirrors web's SPEAKER_THEMES in ConversationPage.jsx).
const SPEAKER_THEMES = [
  { avatar: "#0EA5E9", bubbleRight: "#0EA5E9", name: "#0369A1" },
  { avatar: "#F97316", bubbleRight: "#F97316", name: "#C2410C" },
  { avatar: "#8B5CF6", bubbleRight: "#8B5CF6", name: "#6D28D9" },
  { avatar: "#10B981", bubbleRight: "#10B981", name: "#047857" },
  { avatar: "#EC4899", bubbleRight: "#EC4899", name: "#BE185D" },
  { avatar: "#F59E0B", bubbleRight: "#F59E0B", name: "#B45309" },
];

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export default function ConversationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);
  const insets = useSafeAreaInsets();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const result = await conversationService.getConversation(id as string);
      setConversation(result);
    } catch {
      setError("Could not load this conversation.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const speakerIndexByName = useMemo(() => {
    const map = new Map<string, number>();
    conversation?.text.forEach((turn) => {
      if (!map.has(turn.speaker)) {
        map.set(turn.speaker, map.size);
      }
    });
    return map;
  }, [conversation]);

  const translateMessage = async (message: string) => {
    if (translations[message] || translating[message]) return;
    setTranslating((prev) => ({ ...prev, [message]: true }));
    try {
      const result = await translateService.translate(message, "de", "en");
      setTranslations((prev) => ({ ...prev, [message]: result.translated }));
    } catch {
      setTranslations((prev) => ({ ...prev, [message]: "Translation unavailable" }));
    } finally {
      setTranslating((prev) => ({ ...prev, [message]: false }));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (error || !conversation) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const { english, german } = splitConversationTopic(conversation.topic);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={isDark ? "#F1F5F9" : "#333"}
          />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitleEn} numberOfLines={1}>
            {english}
          </Text>
          {Boolean(german) && (
            <Text style={styles.headerTitleDe} numberOfLines={1}>
              {german}
            </Text>
          )}
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {conversation.text.map((message, index) => {
          const speakerIndex = speakerIndexByName.get(message.speaker) ?? 0;
          const speakerTheme = SPEAKER_THEMES[speakerIndex % SPEAKER_THEMES.length];
          const isRight = index % 2 === 1;
          const previous = conversation.text[index - 1];
          const isContinuation = previous?.speaker === message.speaker;
          const translation = translations[message.message];
          const isTranslating = translating[message.message];

          return (
            <View
              key={index}
              style={[
                styles.turnRow,
                isRight ? styles.turnRowRight : styles.turnRowLeft,
                { marginTop: isContinuation ? 6 : 18 },
              ]}
            >
              <View
                style={[styles.avatar, { backgroundColor: speakerTheme.avatar }]}
              >
                <Text style={styles.avatarText}>{getInitials(message.speaker)}</Text>
              </View>

              <View
                style={[
                  styles.bubbleColumn,
                  isRight ? styles.bubbleColumnRight : styles.bubbleColumnLeft,
                ]}
              >
                <Text style={[styles.speakerName, { color: speakerTheme.name }]}>
                  {message.speaker}
                </Text>

                <View
                  style={[
                    styles.bubble,
                    isRight
                      ? {
                          backgroundColor: speakerTheme.bubbleRight,
                          borderBottomRightRadius: 4,
                        }
                      : {
                          backgroundColor: isDark ? "#1e293b" : "#F1F5F9",
                          borderBottomLeftRadius: 4,
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      { color: isRight ? "#FFFFFF" : isDark ? "#F1F5F9" : "#1F2937" },
                    ]}
                  >
                    {message.message}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.translateButton}
                  onPress={() => translateMessage(message.message)}
                  disabled={isTranslating}
                >
                  {isTranslating ? (
                    <ActivityIndicator size="small" color="#0EA5E9" />
                  ) : (
                    <MaterialCommunityIcons name="translate" size={14} color="#0EA5E9" />
                  )}
                </TouchableOpacity>

                {Boolean(translation) && (
                  <Text style={styles.translationText}>↳ {translation}</Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (isDark: boolean) => {
  const bg = isDark ? "#020617" : "#FFFFFF";
  const textPrimary = isDark ? "#F1F5F9" : "#333333";
  const textMuted = isDark ? "#94A3B8" : "#666666";
  const border = isDark ? "#1e293b" : "#EEEEEE";

  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: bg },
    container: { flex: 1, paddingHorizontal: 16 },
    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: bg,
    },
    errorText: { fontSize: 14, color: "#F87171", textAlign: "center", padding: 16 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    headerTitles: { flex: 1, marginHorizontal: 8, alignItems: "center" },
    headerTitleEn: { fontSize: 15, fontWeight: "700", color: textPrimary },
    headerTitleDe: { fontSize: 12, fontStyle: "italic", color: textMuted },

    turnRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
    turnRowLeft: { flexDirection: "row" },
    turnRowRight: { flexDirection: "row-reverse" },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
    bubbleColumn: { maxWidth: "75%", gap: 4 },
    bubbleColumnLeft: { alignItems: "flex-start" },
    bubbleColumnRight: { alignItems: "flex-end" },
    speakerName: { fontSize: 11, fontWeight: "700", paddingHorizontal: 2 },
    bubble: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
    },
    bubbleText: { fontSize: 14, lineHeight: 20 },
    translateButton: { paddingHorizontal: 2, paddingVertical: 2 },
    translationText: {
      fontSize: 11,
      fontStyle: "italic",
      color: isDark ? "#38BDF8" : "#0284C7",
      paddingHorizontal: 2,
    },
  });
};
