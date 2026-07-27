import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../src/context/ThemeContext";
import ScreenHeader from "../../src/components/ScreenHeader";
import {
  notificationService,
  AppNotification,
} from "../../src/services/notificationService";

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = createStyles(isDark);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await notificationService.getNotifications();
      setNotifications(result);
    } catch {
      setError("Could not load notifications.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Mark-as-read fires the first time a still-unread row is opened, matching
  // web's NotificationList.jsx (not on every tap of an already-read row).
  const handleToggle = (item: AppNotification) => {
    const opening = expandedId !== item.id;
    setExpandedId(opening ? item.id : null);

    if (opening && !item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      );
      notificationService.markAsRead(item.id).catch(() => {});
    }
  };

  const handleCtaPress = (item: AppNotification) => {
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      );
      notificationService.markAsRead(item.id).catch(() => {});
    }
    if (!item.link) return;
    if (/^https?:\/\//.test(item.link)) {
      Linking.openURL(item.link).catch(() => {});
    } else {
      router.push(item.link as any);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="🔔 Notifications" />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => handleToggle(item)}
            >
              <View style={styles.cardHeader}>
                {!item.isRead && <View style={styles.unreadDot} />}
                <Text style={styles.topicText} numberOfLines={isExpanded ? undefined : 1}>
                  {item.topic}
                </Text>
              </View>
              <Text
                style={styles.messageText}
                numberOfLines={isExpanded ? undefined : 1}
              >
                {item.message}
              </Text>
              <Text style={styles.dateText}>
                {new Date(item.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
                {"  ·  — Admin"}
              </Text>

              {isExpanded && Boolean(item.link) && (
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => handleCtaPress(item)}
                >
                  <Text style={styles.ctaButtonText}>Discover now →</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No notifications yet.</Text>
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
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: bg,
    },
    errorText: { fontSize: 13, color: "#F87171", marginBottom: 10 },
    card: {
      backgroundColor: cardBg,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#F97316",
    },
    topicText: { fontSize: 14, fontWeight: "700", color: textPrimary, flex: 1 },
    messageText: { fontSize: 13, color: textMuted, marginBottom: 6, lineHeight: 18 },
    dateText: { fontSize: 11, color: textMuted },
    ctaButton: { marginTop: 10 },
    ctaButtonText: { fontSize: 13, fontWeight: "700", color: "#6366F1" },
    emptyText: {
      fontSize: 14,
      color: textMuted,
      textAlign: "center",
      marginTop: 40,
    },
  });
};
