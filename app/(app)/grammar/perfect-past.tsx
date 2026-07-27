import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../../src/context/ThemeContext";
import perfectPastData from "../../../src/data/grammar/perfectAndPastForm.json";
import type { PerfectPastGroup } from "../../../src/data/grammar/types";

const GROUPS = perfectPastData as PerfectPastGroup[];

export default function PerfectAndPastFormScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return GROUPS.map((group) => {
      const verbs = !query
        ? group.verbs
        : group.verbs.filter((verb) =>
            `${verb.Präsens} ${verb.Präteritum} ${verb.Perfekt} ${verb.meaning}`
              .toLowerCase()
              .includes(query),
          );
      const sorted = [...verbs].sort((a, b) => a.Präsens.localeCompare(b.Präsens));
      return { ...group, verbs: sorted };
    }).filter((group) => group.verbs.length > 0);
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={isDark ? "#F1F5F9" : "#333"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfekt & Präteritum</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.searchBar}>
        <MaterialCommunityIcons
          name="magnify"
          size={18}
          color={isDark ? "#94A3B8" : "#9CA3AF"}
          style={{ marginRight: 6 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search verbs or meanings..."
          placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}>
        {filteredGroups.map((group) => (
          <View key={group.name} style={styles.groupSection}>
            <Text style={styles.groupTitle}>{group.name}</Text>
            {group.verbs.map((verb, idx) => (
              <View
                key={verb.Präsens + idx}
                style={[
                  styles.verbCard,
                  idx % 2 === 0 ? styles.verbCardEven : styles.verbCardOdd,
                ]}
              >
                <View style={styles.verbTopRow}>
                  <Text style={styles.presentText}>{verb.Präsens}</Text>
                  <Text style={styles.meaningText}>{verb.meaning}</Text>
                </View>
                <View style={styles.formsRow}>
                  <View style={styles.formCol}>
                    <Text style={styles.formLabel}>Präteritum</Text>
                    <Text style={styles.formValue}>{verb.Präteritum}</Text>
                    <Text style={styles.formSentence}>{verb.PräteritumSentence}</Text>
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.formLabel}>Perfekt</Text>
                    <Text style={styles.formValue}>{verb.Perfekt}</Text>
                    <Text style={styles.formSentence}>{verb.PerfektSentence}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (isDark: boolean) => {
  const bg = isDark ? "#020617" : "#FFFFFF";
  const cardBg = isDark ? "#0f172a" : "#F9F9F9";
  const rowOdd = isDark ? "#0b1220" : "#F3F4F6";
  const textPrimary = isDark ? "#F1F5F9" : "#1F2937";
  const textMuted = isDark ? "#94A3B8" : "#6B7280";
  const border = isDark ? "#1e293b" : "#EEEEEE";
  const inputBg = isDark ? "#0f172a" : "#F9F9F9";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    headerTitle: { fontSize: 15, fontWeight: "700", color: textPrimary },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginVertical: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: inputBg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: border,
    },
    searchInput: { flex: 1, fontSize: 13, color: textPrimary },
    groupSection: { marginBottom: 18 },
    groupTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#DC2626",
      marginBottom: 8,
    },
    verbCard: { borderRadius: 10, padding: 12, marginBottom: 6 },
    verbCardEven: { backgroundColor: cardBg },
    verbCardOdd: { backgroundColor: rowOdd },
    verbTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    presentText: {
      fontSize: 15,
      fontWeight: "700",
      color: isDark ? "#60A5FA" : "#2563EB",
    },
    meaningText: { fontSize: 12, fontStyle: "italic", color: textMuted },
    formsRow: { flexDirection: "row", gap: 12 },
    formCol: { flex: 1 },
    formLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: "#8B5CF6",
      textTransform: "uppercase",
      marginBottom: 2,
    },
    formValue: { fontSize: 13, fontWeight: "600", color: textPrimary, marginBottom: 2 },
    formSentence: { fontSize: 11, color: textMuted, lineHeight: 15 },
  });
};
