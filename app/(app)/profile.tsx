import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Container } from "../../src/components/Container";
import { useAuth } from "../../src/hooks/useAppHooks";
import { logout } from "../../src/redux/authSlice";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, dispatch } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await dispatch(logout());
          router.replace("/(auth)/login");
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {user && (
        <>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>⚙️ Account Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>📋 Help & Support</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  profileCard: {
    flexDirection: "row",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#fff" },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 4,
  },
  userEmail: { fontSize: 13, color: "#666666" },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999999",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  menuItem: {
    backgroundColor: "#F5F5F5",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  menuText: { fontSize: 15, fontWeight: "500", color: "#333333" },
  logoutButton: {
    backgroundColor: "#FF6B6B",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 30,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
