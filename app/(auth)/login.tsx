import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppSelector } from "../../src/hooks/useAppHooks";
import { login } from "../../src/redux/authSlice";
import ContactLink from "../../src/components/ContactLink";

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      await dispatch(login({ email, password })).unwrap();
      router.replace("/(app)/home");
    } catch (err) {
      Alert.alert("Login Failed", error || "Please try again");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-slate-950"
      contentContainerStyle={{ justifyContent: "center", padding: 20, minHeight: "100%" }}
    >
      <Text className="mb-2 text-center text-3xl font-bold text-orange-600">
        Sprachgenie
      </Text>
      <Text className="mb-10 text-center text-sm text-gray-500 dark:text-slate-400">
        Learn German Through Stories
      </Text>

      <View className="mb-5">
        <Text className="mb-2 text-sm font-semibold text-gray-800 dark:text-slate-200">
          Email
        </Text>
        <TextInput
          className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          placeholder="your@email.com"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text className="mb-2 text-sm font-semibold text-gray-800 dark:text-slate-200">
          Password
        </Text>
        <TextInput
          className="mb-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
          secureTextEntry
        />

        <TouchableOpacity
          onPress={() => router.push("/(auth)/forgot-password")}
          disabled={isLoading}
          className="mb-4 self-end"
        >
          <Text className="text-xs font-semibold text-sky-600 dark:text-sky-400">
            Forgot password?
          </Text>
        </TouchableOpacity>

        {error && <Text className="mb-4 text-sm text-rose-600">{error}</Text>}

        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          className={`items-center rounded-xl bg-orange-600 p-4 ${isLoading ? "opacity-60" : ""}`}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">Login</Text>
          )}
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-center">
        <Text className="text-sm text-gray-500 dark:text-slate-400">
          Don&apos;t have an account?{" "}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/signup")}
          disabled={isLoading}
        >
          <Text className="text-sm font-semibold text-orange-600">Sign Up</Text>
        </TouchableOpacity>
      </View>

      <ContactLink disabled={isLoading} />
    </ScrollView>
  );
}
