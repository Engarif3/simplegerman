import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

// Mirrors WordTableRow's column widths exactly, and (like web) leaves the
// first column's header blank — it shows either an article or a part-of-
// speech badge per row, so no single label fits it.
export default function WordTableHeader() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);

  return (
    <View style={styles.tableHeader}>
      <View style={styles.colArt} />
      <View style={styles.colWord}>
        <Text style={styles.headerText}>Word</Text>
      </View>
      <View style={styles.colMeaning}>
        <Text style={styles.headerText}>Meaning</Text>
      </View>
      <View style={styles.colConjugate}>
        <Text style={styles.headerText}>Conj.</Text>
      </View>
      <View style={styles.colAction}>
        <Text style={styles.headerText}>❤️</Text>
      </View>
    </View>
  );
}

const createStyles = (isDark: boolean) => {
  const panelBg = isDark ? "#0f172a" : "#F9FAFB";
  const textPrimary = isDark ? "#F1F5F9" : "#333333";

  return StyleSheet.create({
    tableHeader: {
      flexDirection: "row",
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: panelBg,
      borderBottomWidth: 2,
      borderBottomColor: "#FF6B6B",
      alignItems: "center",
      columnGap: 14,
    },
    headerText: {
      fontSize: 10,
      fontWeight: "700",
      color: textPrimary,
      textTransform: "uppercase",
    },
    colArt: { minWidth: 30, alignItems: "center", marginRight: 16 },
    colWord: { flex: 3, alignItems: "flex-start" },
    colMeaning: { flex: 2, alignItems: "flex-start" },
    colConjugate: { width: 34, alignItems: "center" },
    colAction: { width: 28, alignItems: "center" },
  });
};
