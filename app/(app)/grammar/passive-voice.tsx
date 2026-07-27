import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../../src/context/ThemeContext";

// Mirrors web: PassiveVoice.jsx is an unimplemented stub there too — there
// is no content/JSON to port yet.
export default function PassiveVoiceScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={isDark ? "#F1F5F9" : "#333"}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.centerContainer}>
        <Text style={styles.emoji}>🔄</Text>
        <Text style={styles.title}>Passive Voice</Text>
        <Text style={styles.subtitle}>Coming soon…</Text>
      </View>
    </View>
  );
}

const createStyles = (isDark: boolean) => {
  const bg = isDark ? "#020617" : "#FFFFFF";
  const textPrimary = isDark ? "#F1F5F9" : "#1F2937";
  const textMuted = isDark ? "#94A3B8" : "#6B7280";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    header: { paddingHorizontal: 16, paddingVertical: 12 },
    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginTop: -60,
    },
    emoji: { fontSize: 48, marginBottom: 12 },
    title: { fontSize: 22, fontWeight: "700", color: textPrimary, marginBottom: 6 },
    subtitle: { fontSize: 14, color: textMuted },
  });
};
