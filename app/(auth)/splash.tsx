import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    console.log("[Splash] Screen mounted");

    const timer = setTimeout(() => {
      console.log("[Splash] Navigating to login");
      router.replace("/(auth)/login");
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          marginBottom: 20,
          color: "#FF6B6B",
        }}
      >
        Sprachgenie
      </Text>
      <ActivityIndicator size="large" color="#FF6B6B" />
    </View>
  );
}
