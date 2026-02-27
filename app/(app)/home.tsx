import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/hooks/useAppHooks";
import { logout } from "../../src/redux/authSlice";

export default function HomeScreen() {
  const router = useRouter();
  const { user, dispatch } = useAuth();

  const handleLogout = async () => {
    await dispatch(logout());
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome to Sprachgenie! 👋</Text>
        {user && <Text style={styles.userName}>Hello, {user.name}!</Text>}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(app)/stories")}
        >
          <Text style={styles.buttonText}>📖 Read Stories</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(app)/profile")}
        >
          <Text style={styles.buttonText}>👤 My Profile</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  welcomeSection: { marginTop: 20, marginBottom: 30 },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
  },
  userName: { fontSize: 16, fontWeight: "600", color: "#FF6B6B" },
  buttonContainer: { marginBottom: 30 },
  button: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonText: { fontSize: 16, fontWeight: "500", color: "#333333" },
  logoutButton: {
    backgroundColor: "#FF6B6B",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
