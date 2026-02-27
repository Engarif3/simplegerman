import React from "react";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTintColor: "#333333",
        headerTitleStyle: { fontWeight: "600", fontSize: 18 },
        tabBarActiveTintColor: "#FF6B6B",
        tabBarInactiveTintColor: "#999999",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#EEEEEE",
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stories"
        options={{
          title: "Stories",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="book-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="vocabulary"
        options={{
          title: "Vocabulary",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="library-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
