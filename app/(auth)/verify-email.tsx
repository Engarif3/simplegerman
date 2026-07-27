import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { authService } from "../../src/services/authService";
import ContactLink from "../../src/components/ContactLink";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!params.token) {
      setStatus("error");
      setMessage("This verification link is missing its token.");
      return;
    }

    authService
      .verifyEmail(params.token)
      .then((result) => {
        setStatus("success");
        setMessage(result.message);
      })
      .catch(() => {
        setStatus("error");
        setMessage("This verification link is invalid or has expired.");
      });
  }, [params.token]);

  return (
    <View className="flex-1 items-center justify-center bg-white p-6 dark:bg-slate-950">
      {status === "loading" && <ActivityIndicator size="large" color="#ea580c" />}

      {status !== "loading" && (
        <>
          <Text className="mb-4 text-5xl">{status === "success" ? "✅" : "⚠️"}</Text>
          <Text className="mb-2 text-center text-xl font-bold text-gray-900 dark:text-white">
            {status === "success" ? "Email verified" : "Verification failed"}
          </Text>
          <Text className="mb-8 text-center text-sm text-gray-500 dark:text-slate-400">
            {message}
          </Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text className="text-sm font-semibold text-sky-600 dark:text-sky-400">
              Go to Login
            </Text>
          </TouchableOpacity>

          <ContactLink />
        </>
      )}
    </View>
  );
}
