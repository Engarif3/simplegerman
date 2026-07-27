import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Share, Linking, Alert } from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
}

// Mirrors web's ShareSiteModal.jsx: same URL/title/text, same QR code +
// native-share + WhatsApp/Telegram/Messenger set (minus the desktop-only
// Facebook "dialog/send" fallback, which doesn't apply on a phone).
const SITE_URL = "https://simplegerman.de";
const SITE_TITLE = "SimpleGerman";
const SITE_TEXT = "Learn German with SimpleGerman";

export default function ShareModal({ visible, onClose }: ShareModalProps) {
  const encodedShareText = encodeURIComponent(`${SITE_TEXT} ${SITE_URL}`);

  const handleNativeShare = async () => {
    try {
      await Share.share({
        title: SITE_TITLE,
        message: `${SITE_TEXT} ${SITE_URL}`,
        url: SITE_URL,
      });
    } catch {
      // user cancelled — nothing to do
    }
  };

  const openOrCopy = async (url: string, appName: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // fall through to clipboard fallback below
    }

    await Clipboard.setStringAsync(SITE_URL);
    Alert.alert(
      `${appName} not available`,
      "Link copied to clipboard — paste it there instead.",
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close share modal"
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.eyebrow}>SHARE SIMPLEGERMAN</Text>
          <Text style={styles.title}>Open on any device</Text>
          <Text style={styles.subtitle}>
            Share the link directly or scan the QR code to open {SITE_URL}.
          </Text>

          <View style={styles.qrBox}>
            <View style={styles.qrWhite}>
              <QRCode value={SITE_URL} size={160} />
            </View>
            <Text style={styles.qrCaption}>Scan to open SimpleGerman instantly.</Text>
          </View>

          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[styles.button, styles.shareButton]}
              onPress={handleNativeShare}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="share-variant" size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>Share / Copy Link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.whatsappButton]}
              onPress={() =>
                openOrCopy(`https://wa.me/?text=${encodedShareText}`, "WhatsApp")
              }
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="whatsapp" size={18} color="#FFFFFF" />
              <Text style={styles.buttonText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.telegramButton]}
              onPress={() =>
                openOrCopy(
                  `https://t.me/share/url?url=${encodeURIComponent(SITE_URL)}&text=${encodedShareText}`,
                  "Telegram",
                )
              }
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="telegram" size={18} color="#FFFFFF" />
              <Text style={styles.buttonText}>Telegram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.messengerButton]}
              onPress={() =>
                openOrCopy(
                  `fb-messenger://share?link=${encodeURIComponent(SITE_URL)}`,
                  "Messenger",
                )
              }
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="facebook-messenger" size={18} color="#FFFFFF" />
              <Text style={styles.buttonText}>Messenger</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(3, 105, 161, 0.5)",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 16,
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    zIndex: 1,
  },
  closeButtonText: { color: "#FFFFFF", fontSize: 18, lineHeight: 20 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#38BDF8",
    marginBottom: 6,
    paddingRight: 40,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", marginBottom: 8 },
  subtitle: { fontSize: 13, color: "#CBD5E1", marginBottom: 20, lineHeight: 19 },
  qrBox: {
    alignItems: "center",
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 18,
    marginBottom: 20,
  },
  qrWhite: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
  },
  qrCaption: { fontSize: 13, color: "#CBD5E1", textAlign: "center" },
  buttonGrid: { gap: 10 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
  },
  shareButton: { backgroundColor: "#0284C7" },
  whatsappButton: { backgroundColor: "#16A34A" },
  telegramButton: { backgroundColor: "#0EA5E9" },
  messengerButton: { backgroundColor: "#4F46E5" },
  buttonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
});
