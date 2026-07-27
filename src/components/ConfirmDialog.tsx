import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  // Default (false) matches SweetAlert2's layout used elsewhere in this
  // app: Cancel on the left, Confirm on the right. Set true to swap them.
  confirmFirst?: boolean;
  // Defaults to the warning icon this component was originally built
  // around (logout/remove-favorite confirmations). Pass "" to omit it
  // entirely for dialogs that aren't warnings (e.g. a plain info prompt).
  icon?: string;
}

// react-native-web's Alert.alert is a no-op stub and window.confirm() renders
// an unstyled OS dialog, so neither gives a consistent, on-brand confirmation
// across web and native. This mirrors the web app's SweetAlert2 "Remove from
// Favorites?" dialog (warning icon, blue cancel, red confirm) as a plain RN
// Modal, which renders identically on every platform.
export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Yes, remove it!",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmFirst = false,
  icon = "⚠️",
}: ConfirmDialogProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const cardBg = isDark ? "#0f172a" : "#FFFFFF";
  const titleColor = isDark ? "#F1F5F9" : "#1F2937";
  const messageColor = isDark ? "#CBD5E1" : "#4B5563";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {Boolean(icon) && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
          <Text style={[styles.message, { color: messageColor }]}>
            {message}
          </Text>
          <View style={styles.buttonRow}>
            {confirmFirst && (
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={onConfirm}
              >
                <Text style={styles.buttonText}>{confirmLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.buttonText}>{cancelLabel}</Text>
            </TouchableOpacity>
            {!confirmFirst && (
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={onConfirm}
              >
                <Text style={styles.buttonText}>{confirmLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
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
    maxWidth: 360,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#3085d6",
  },
  confirmButton: {
    backgroundColor: "#d33",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
