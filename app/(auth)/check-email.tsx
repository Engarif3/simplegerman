import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { authService } from "../../src/services/authService";

export default function CheckEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; message?: string }>();
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (!params.email) return;

    setIsResending(true);
    try {
      const result = await authService.resendVerification(params.email);
      Alert.alert("Verification email", result.message);
    } catch {
      Alert.alert("Error", "Could not resend the verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white p-6 dark:bg-slate-950">
      <Text className="mb-4 text-5xl">📬</Text>
      <Text className="mb-2 text-center text-xl font-bold text-gray-900 dark:text-white">
        Check your email
      </Text>
      <Text className="mb-8 text-center text-sm text-gray-500 dark:text-slate-400">
        {params.message ||
          "We've sent a verification link to your email address. Verify it to activate your account."}
      </Text>

      <TouchableOpacity
        onPress={handleResend}
        disabled={isResending || !params.email}
        className={`mb-4 items-center rounded-xl border border-orange-600 px-6 py-3 ${
          isResending ? "opacity-60" : ""
        }`}
      >
        {isResending ? (
          <ActivityIndicator color="#ea580c" />
        ) : (
          <Text className="font-semibold text-orange-600">
            Resend verification email
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
        <Text className="text-sm font-semibold text-sky-600 dark:text-sky-400">
          Back to Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}
