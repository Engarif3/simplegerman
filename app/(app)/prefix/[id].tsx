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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../../src/context/ThemeContext";
import {
  prefixService,
  Prefix,
  PrefixTypeDetail,
} from "../../../src/services/prefixService";

interface PrefixGroup {
  prefixName: string;
  verbs: Prefix[];
  noVerbs: Prefix[];
}

function groupPrefixes(prefixes: Prefix[]): PrefixGroup[] {
  const groups = new Map<string, PrefixGroup>();

  prefixes.forEach((prefix) => {
    const key = prefix.prefixName.trim().toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, { prefixName: key, verbs: [], noVerbs: [] });
    }
    const group = groups.get(key)!;
    if (prefix.verb) {
      group.verbs.push(prefix);
    } else {
      group.noVerbs.push(prefix);
    }
  });

  const sortByWord = (a: Prefix, b: Prefix) => a.prefixWord.localeCompare(b.prefixWord);
  groups.forEach((group) => {
    group.verbs.sort(sortByWord);
    group.noVerbs.sort(sortByWord);
  });

  return Array.from(groups.values());
}

export default function PrefixListScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);

  const [data, setData] = useState<PrefixTypeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const result = await prefixService.getPrefixType(id as string);
      setData(result);
    } catch {
      setError("Could not load this prefix type.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleExpand = (prefixId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(prefixId)) {
        next.delete(prefixId);
      } else {
        next.add(prefixId);
      }
      return next;
    });
  };

  const groups = useMemo(
    () => (data ? groupPrefixes(data.prefixes) : []),
    [data],
  );

  if (isLoading || (!data && !error)) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const renderWordList = (words: Prefix[]) =>
    words.map((word, index) => (
      <View key={word.id}>
        <TouchableOpacity
          style={[
            styles.wordRow,
            index % 2 === 0 ? styles.wordRowEven : styles.wordRowOdd,
          ]}
          onPress={() => toggleExpand(word.id)}
          activeOpacity={0.7}
        >
          <View style={styles.wordRowText}>
            <Text style={styles.wordText}>{word.prefixWord}</Text>
            <Text style={styles.wordMeaning}>({word.meaning.join(", ")})</Text>
          </View>
          <MaterialCommunityIcons
            name={expandedIds.has(word.id) ? "minus" : "plus"}
            size={18}
            color={isDark ? "#38BDF8" : "#2563EB"}
          />
        </TouchableOpacity>

        {expandedIds.has(word.id) && (
          <View style={styles.sentencesBox}>
            <Text style={styles.sentencesLabel}>📝 Sentences</Text>
            {word.sentences.map((sentence, idx) => (
              <Text key={idx} style={styles.sentenceText}>
                • {sentence}
              </Text>
            ))}
          </View>
        )}
      </View>
    ));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={isDark ? "#F1F5F9" : "#333"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {data.name} Prefixes
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {groups.map((group) => (
        <View key={group.prefixName} style={styles.groupSection}>
          <Text style={styles.groupTitle}>{group.prefixName.toUpperCase()}</Text>

          {group.verbs.length > 0 && (
            <View style={styles.subGroup}>
              <Text style={styles.subGroupHeader}>
                Verbs ({group.verbs.length})
              </Text>
              {renderWordList(group.verbs)}
            </View>
          )}

          {group.noVerbs.length > 0 && (
            <View style={styles.subGroup}>
              <Text style={styles.subGroupHeader}>
                Non-Verbs ({group.noVerbs.length})
              </Text>
              {renderWordList(group.noVerbs)}
            </View>
          )}
        </View>
      ))}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const createStyles = (isDark: boolean) => {
  const bg = isDark ? "#020617" : "#FFFFFF";
  const cardBg = isDark ? "#0f172a" : "#F9F9F9";
  const border = isDark ? "#1e293b" : "#EEEEEE";
  const textPrimary = isDark ? "#F1F5F9" : "#1F2937";
  const rowEven = isDark ? "#0f172a" : "#FFFFFF";
  const rowOdd = isDark ? "#0b1220" : "#F9FAFB";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg, paddingHorizontal: 16 },
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
      paddingVertical: 12,
      marginBottom: 8,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: textPrimary,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 8,
    },
    groupSection: { marginBottom: 20 },
    groupTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#DC2626",
      marginBottom: 8,
    },
    subGroup: {
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 12,
    },
    subGroupHeader: {
      backgroundColor: "#0891B2",
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    wordRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    wordRowEven: { backgroundColor: rowEven },
    wordRowOdd: { backgroundColor: rowOdd },
    wordRowText: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", flex: 1 },
    wordText: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#60A5FA" : "#2563EB",
      marginRight: 6,
    },
    wordMeaning: { fontSize: 13, color: isDark ? "#C4B5FD" : "#7C3AED" },
    sentencesBox: {
      backgroundColor: cardBg,
      borderBottomWidth: 1,
      borderBottomColor: border,
      padding: 14,
    },
    sentencesLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: "#10B981",
      marginBottom: 8,
    },
    sentenceText: {
      fontSize: 13,
      color: textPrimary,
      lineHeight: 20,
      marginBottom: 4,
    },
  });
};
