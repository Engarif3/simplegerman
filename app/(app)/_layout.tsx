import React from "react";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/context/ThemeContext";

const PALETTE = {
  dark: {
    header: "#0f172a",
    headerTint: "#f1f5f9",
    tabBar: "#0f172a",
    tabBarBorder: "#1e293b",
    active: "#38bdf8",
    inactive: "#64748b",
  },
  light: {
    header: "#FFFFFF",
    headerTint: "#1f2937",
    tabBar: "#FFFFFF",
    tabBarBorder: "#EEEEEE",
    active: "#ea580c",
    inactive: "#9CA3AF",
  },
};

export default function AppLayout() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const colors = PALETTE[theme];

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: colors.header },
        headerTintColor: colors.headerTint,
        headerTitleStyle: { fontWeight: "600", fontSize: 18 },
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("navbar.home"),
          // Renders its own SprachGenie wordmark at the top of the screen —
          // showing the native "Home" header above that looked backwards.
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="vocabulary"
        options={{
          title: t("navbar.vocabulary"),
          // The screen renders its own "📚 Vocabulary" title — showing the
          // native header too duplicated it.
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-alphabet" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="radio"
        options={{
          title: t("navbar.radio"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="radio" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: t("navbar.favorites"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t("navbar.profile"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Every hub/list screen below renders its own in-content title
          (emoji + heading + subtitle), so the native header is turned off
          for all of them — leaving it on duplicated the title on every one
          of these pages. */}
      <Tabs.Screen
        name="stories"
        options={{ href: null, title: "Stories", headerShown: false }}
      />
      <Tabs.Screen name="story/[id]" options={{ headerShown: false, href: null }} />
      <Tabs.Screen name="word/[id]" options={{ headerShown: false, href: null }} />
      <Tabs.Screen
        name="prefix"
        options={{ href: null, title: "Prefix Types", headerShown: false }}
      />
      <Tabs.Screen name="prefix/[id]" options={{ headerShown: false, href: null }} />
      <Tabs.Screen
        name="quiz"
        options={{ href: null, title: "Quiz", headerShown: false }}
      />
      <Tabs.Screen
        name="conversations"
        options={{ href: null, title: "Conversations", headerShown: false }}
      />
      <Tabs.Screen name="conversation/[id]" options={{ headerShown: false, href: null }} />
      <Tabs.Screen
        name="grammar"
        options={{ href: null, title: "Grammar", headerShown: false }}
      />
      <Tabs.Screen name="grammar/clauses" options={{ headerShown: false, href: null }} />
      <Tabs.Screen name="grammar/clause/[type]" options={{ headerShown: false, href: null }} />
      <Tabs.Screen name="grammar/passive-voice" options={{ headerShown: false, href: null }} />
      <Tabs.Screen name="grammar/verb-preposition" options={{ headerShown: false, href: null }} />
      <Tabs.Screen name="grammar/adjective-preposition" options={{ headerShown: false, href: null }} />
      <Tabs.Screen name="grammar/perfect-past" options={{ headerShown: false, href: null }} />
      <Tabs.Screen name="grammar/verbs-gehen" options={{ headerShown: false, href: null }} />
      <Tabs.Screen
        name="challenge/index"
        options={{ href: null, title: "Challenge", headerShown: false }}
      />
      <Tabs.Screen name="challenge/[level]" options={{ headerShown: false, href: null }} />
      <Tabs.Screen name="challenge/leaderboard" options={{ headerShown: false, href: null }} />
      <Tabs.Screen
        name="notifications"
        options={{ href: null, title: "Notifications", headerShown: false }}
      />
      <Tabs.Screen
        name="contact"
        options={{ href: null, title: "Contact", headerShown: false }}
      />
    </Tabs>
  );
}
