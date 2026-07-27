import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { authService } from "../../src/services/authService";
import ContactLink from "../../src/components/ContactLink";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.forgotPassword({ email });
      Alert.alert("Check your email", result.message, [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      className="flex-1 justify-center bg-white p-6 dark:bg-slate-950"
    >
      <Text className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-white">
        Forgot Password
      </Text>
      <Text className="mb-8 text-center text-sm text-gray-500 dark:text-slate-400">
        Enter your email and we'll send you a link to reset your password.
      </Text>

      <TextInput
        className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        placeholder="your@email.com"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        editable={!isLoading}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isLoading}
        className={`mb-4 items-center rounded-xl bg-orange-600 p-4 ${isLoading ? "opacity-60" : ""}`}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-semibold text-white">Send Reset Link</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
        <Text className="text-center text-sm font-semibold text-sky-600 dark:text-sky-400">
          Back to Login
        </Text>
      </TouchableOpacity>

      <ContactLink disabled={isLoading} />
    </View>
  );
}
