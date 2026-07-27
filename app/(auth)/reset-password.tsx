import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { authService } from "../../src/services/authService";
import ContactLink from "../../src/components/ContactLink";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; token?: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!params.id || !params.token) {
      Alert.alert(
        "Invalid link",
        "This password reset link is invalid or has expired. Please request a new one.",
      );
      return;
    }

    if (!password || password !== confirmPassword) {
      Alert.alert("Error", "Passwords must match and cannot be empty");
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        id: params.id,
        token: params.token,
        password,
      });
      Alert.alert("Password reset", "You can now log in with your new password.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch {
      Alert.alert("Error", "Could not reset your password. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-white p-6 dark:bg-slate-950">
      <Text className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">
        Reset Password
      </Text>

      <TextInput
        className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        placeholder="New password"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword}
        editable={!isLoading}
        secureTextEntry
      />

      <TextInput
        className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        placeholder="Confirm new password"
        placeholderTextColor="#9CA3AF"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        editable={!isLoading}
        secureTextEntry
      />

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isLoading}
        className={`items-center rounded-xl bg-orange-600 p-4 ${isLoading ? "opacity-60" : ""}`}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-semibold text-white">Reset Password</Text>
        )}
      </TouchableOpacity>

      <ContactLink disabled={isLoading} />
    </View>
  );
}
