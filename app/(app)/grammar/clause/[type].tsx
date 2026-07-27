import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../../../src/context/ThemeContext";
import { highlightConjunctions } from "../../../../src/utils/highlightConjunctions";
import type { ClauseEntry } from "../../../../src/data/grammar/types";

import coordinatingData from "../../../../src/data/grammar/coordinating.json";
import subordinatingData from "../../../../src/data/grammar/subordinating.json";
import conjunctiveData from "../../../../src/data/grammar/conjunctive.json";
import otherData from "../../../../src/data/grammar/other.json";

const CLAUSE_DATASETS: Record<string, { title: string; data: ClauseEntry[] }> = {
  coordinating: { title: "Coordinating Clauses", data: coordinatingData as ClauseEntry[] },
  subordinating: { title: "Subordinating Clauses", data: subordinatingData as ClauseEntry[] },
  conjunctive: { title: "Conjunctive Adverbs", data: conjunctiveData as ClauseEntry[] },
  other: { title: "Others", data: otherData as ClauseEntry[] },
};

export default function ClauseDetailScreen() {
  const { type } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const dataset = CLAUSE_DATASETS[type as string] ?? CLAUSE_DATASETS.coordinating;

  const toggleExpand = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={isDark ? "#F1F5F9" : "#333"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{dataset.title}</Text>
        <View style={{ width: 28 }} />
      </View>

      {dataset.data.map((item, index) => {
        const isOpen = expanded.has(index);
        return (
          <View key={item.conjunction + index} style={styles.item}>
            <TouchableOpacity
              style={styles.itemHeader}
              onPress={() => toggleExpand(index)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.conjunctionText}>{item.conjunction}</Text>
                <Text style={styles.meaningText}>{item.meaning}</Text>
              </View>
              <MaterialCommunityIcons
                name={isOpen ? "minus" : "plus"}
                size={18}
                color={isDark ? "#38BDF8" : "#2563EB"}
              />
            </TouchableOpacity>

            {isOpen && (
              <View style={styles.itemBody}>
                {Boolean(item.rules?.length) && (
                  <View style={styles.rulesBox}>
                    {item.rules!.map((rule, ridx) => (
                      <Text key={ridx} style={styles.ruleText}>
                        • {rule}
                      </Text>
                    ))}
                  </View>
                )}

                <Text style={styles.examplesLabel}>Examples</Text>
                {item.examples.map((example, eidx) => {
                  const segments = highlightConjunctions(example, item.conjunction);
                  return (
                    <Text key={eidx} style={styles.exampleText}>
                      {segments.map((segment, sidx) =>
                        segment.highlighted ? (
                          <Text key={sidx} style={styles.highlightedText}>
                            {segment.text}
                          </Text>
                        ) : (
                          segment.text
                        ),
                      )}
                    </Text>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (isDark: boolean) => {
  const bg = isDark ? "#020617" : "#FFFFFF";
  const cardBg = isDark ? "#0f172a" : "#F9F9F9";
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
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: textPrimary,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 8,
    },
    item: {
      backgroundColor: cardBg,
      borderRadius: 12,
      marginBottom: 10,
      overflow: "hidden",
    },
    itemHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 10,
    },
    conjunctionText: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#60A5FA" : "#2563EB",
    },
    meaningText: { fontSize: 12, color: isDark ? "#C4B5FD" : "#7C3AED", marginTop: 2 },
    itemBody: {
      borderTopWidth: 1,
      borderTopColor: border,
      padding: 14,
    },
    rulesBox: { marginBottom: 10 },
    ruleText: { fontSize: 12, color: textMuted, lineHeight: 18, marginBottom: 4 },
    examplesLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: "#10B981",
      textTransform: "uppercase",
      marginBottom: 6,
    },
    exampleText: { fontSize: 13, color: textPrimary, lineHeight: 20, marginBottom: 6 },
    highlightedText: {
      color: "#0EA5E9",
      fontWeight: "700",
    },
  });
};
