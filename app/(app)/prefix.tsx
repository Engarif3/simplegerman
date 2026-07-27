import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/context/ThemeContext";
import ScreenHeader from "../../src/components/ScreenHeader";
import { prefixService, PrefixType } from "../../src/services/prefixService";

export default function PrefixTypesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);

  const [prefixTypes, setPrefixTypes] = useState<PrefixType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await prefixService.getPrefixTypes();
      setPrefixTypes(result);
    } catch {
      setError("Could not load prefix types.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Prefix Types" />
      <Text style={styles.eyebrow}>🔤 WORD FORMATION</Text>
      <Text style={styles.subtitle}>
        Understand German word formation with prefix combinations
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={prefixTypes}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push(`/prefix/${item.id}`)}
          >
            <View style={styles.indexBadge}>
              <Text style={styles.indexBadgeText}>{index + 1}</Text>
            </View>
            <Text style={styles.cardIcon}>🔤</Text>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardCta}>Explore Words →</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No prefix types available</Text>
        }
      />
    </View>
  );
}

const createStyles = (isDark: boolean) => {
  const bg = isDark ? "#020617" : "#FFFFFF";
  const cardBg = isDark ? "#0f172a" : "#F9F9F9";
  const textPrimary = isDark ? "#F1F5F9" : "#1F2937";
  const textMuted = isDark ? "#94A3B8" : "#6B7280";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg, padding: 16 },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: bg,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: "700",
      color: "#F97316",
      textAlign: "center",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 13,
      color: textMuted,
      textAlign: "center",
      marginBottom: 20,
    },
    errorText: {
      fontSize: 13,
      color: "#F87171",
      textAlign: "center",
      marginBottom: 12,
    },
    listContent: { paddingBottom: 20 },
    row: { gap: 12 },
    card: {
      flex: 1,
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      minHeight: 130,
    },
    indexBadge: {
      position: "absolute",
      top: -8,
      right: -8,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: "#F97316",
      alignItems: "center",
      justifyContent: "center",
    },
    indexBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
    cardIcon: { fontSize: 28, marginBottom: 8 },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: textPrimary,
      marginBottom: 10,
    },
    cardCta: { fontSize: 12, fontWeight: "600", color: "#F97316" },
    emptyText: {
      fontSize: 14,
      color: textMuted,
      textAlign: "center",
      marginTop: 40,
    },
  });
};
