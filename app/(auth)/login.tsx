import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppSelector } from "../../src/hooks/useAppHooks";
import { login } from "../../src/redux/authSlice";

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Sprachgenie</Text>
      <Text style={styles.subtitle}>Learn German Through Stories</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
          secureTextEntry
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.loginBtn, isLoading && styles.disabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/signup")}
          disabled={isLoading}
        >
          <Text style={styles.signupLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { justifyContent: "center", padding: 20, minHeight: "100%" },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 40,
  },
  form: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#333333", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    backgroundColor: "#F9F9F9",
  },
  error: { color: "#C41E3A", fontSize: 13, marginBottom: 16 },
  loginBtn: {
    backgroundColor: "#FF6B6B",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  loginText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: { color: "#666666", fontSize: 14 },
  signupLink: { color: "#FF6B6B", fontSize: 14, fontWeight: "600" },
});
