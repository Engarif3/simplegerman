import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SvgXml } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { PRESET_AVATAR_IDS, PRESET_AVATAR_SVG } from "../assets/avatars/presetAvatars";

interface AvatarPickerProps {
  visible: boolean;
  selectedAvatarId?: string | null;
  saving?: boolean;
  error?: string | null;
  onSelect: (avatarId: string) => void;
  onClose: () => void;
}

// Web's avatar picker is a grid of 20 preset SVG icons (avatar-01..
// avatar-20), not a camera/photo upload — this mirrors that exactly using
// react-native-svg's SvgXml to render the same markup copied from web's
// public/avatars/*.svg (see src/assets/avatars/presetAvatars.ts).
export default function AvatarPicker({
  visible,
  selectedAvatarId,
  saving,
  error,
  onSelect,
  onClose,
}: AvatarPickerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const cardBg = isDark ? "#0f172a" : "#FFFFFF";
  const textPrimary = isDark ? "#F1F5F9" : "#1F2937";
  const slotBg = isDark ? "#1e293b" : "#F1F5F9";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textPrimary }]}>Choose an Avatar</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={isDark ? "#94A3B8" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.grid}>
            {PRESET_AVATAR_IDS.map((id) => {
              const isSelected = selectedAvatarId === id;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => onSelect(id)}
                  disabled={saving}
                  style={[
                    styles.slot,
                    { backgroundColor: slotBg },
                    isSelected && styles.slotSelected,
                  ]}
                >
                  <SvgXml xml={PRESET_AVATAR_SVG[id]} width={48} height={48} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {saving && (
            <View style={styles.savingRow}>
              <ActivityIndicator size="small" color="#0EA5E9" />
              <Text style={[styles.savingText, { color: textPrimary }]}>Saving…</Text>
            </View>
          )}

          {Boolean(error) && !saving && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { fontSize: 16, fontWeight: "700" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  slot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  slotSelected: { borderColor: "#0EA5E9" },
  savingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
  },
  savingText: { fontSize: 13, fontWeight: "600" },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    textAlign: "center",
    marginTop: 12,
  },
});
