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
import { signUp } from "../../src/redux/authSlice";
import ContactLink from "../../src/components/ContactLink";

export default function SignUpScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      const result = await dispatch(signUp({ name, email, password })).unwrap();
      router.replace({
        pathname: "/(auth)/check-email",
        params: { email, message: result.message },
      });
    } catch (err) {
      Alert.alert("Sign Up Failed", error || "Please try again");
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
        Create Your Account
      </Text>

      <View className="mb-5">
        <Text className="mb-2 text-sm font-semibold text-gray-800 dark:text-slate-200">
          Full Name
        </Text>
        <TextInput
          className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          placeholder="John Doe"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
          editable={!isLoading}
        />

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
          className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
          secureTextEntry
        />

        <Text className="mb-2 text-sm font-semibold text-gray-800 dark:text-slate-200">
          Confirm Password
        </Text>
        <TextInput
          className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isLoading}
          secureTextEntry
        />

        {error && <Text className="mb-4 text-sm text-rose-600">{error}</Text>}

        <TouchableOpacity
          onPress={handleSignUp}
          disabled={isLoading}
          className={`items-center rounded-xl bg-orange-600 p-4 ${isLoading ? "opacity-60" : ""}`}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">
              Create Account
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-center">
        <Text className="text-sm text-gray-500 dark:text-slate-400">
          Already have an account?{" "}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          disabled={isLoading}
        >
          <Text className="text-sm font-semibold text-orange-600">Login</Text>
        </TouchableOpacity>
      </View>

      <ContactLink disabled={isLoading} />
    </ScrollView>
  );
}
