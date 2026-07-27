import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  // Optional element shown where the right-side spacer would otherwise go
  // (e.g. a streak badge) — kept the same width class as the back chevron
  // so the title still centers correctly when this is absent.
  right?: React.ReactNode;
}

// Single shared header for every hub/list screen (Vocabulary, Stories,
// Grammar, Prefix, Quiz, Conversations, Daily Challenge, Notifications,
// etc.) so title size/weight/position are identical everywhere, instead of
// each screen hand-rolling its own slightly-different header.
export default function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { marginTop: Math.max(insets.top, 12) }]}>
      <TouchableOpacity
        onPress={onBack ?? (() => router.back())}
        style={styles.side}
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={26}
          color={isDark ? "#F1F5F9" : "#333"}
        />
      </TouchableOpacity>

      <Text
        style={[styles.title, { color: isDark ? "#F1F5F9" : "#1F2937" }]}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  side: {
    width: 32,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },
});
