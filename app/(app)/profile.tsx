import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/hooks/useAppHooks";
import { logout, setUser } from "../../src/redux/authSlice";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { SvgXml } from "react-native-svg";
import { userService } from "../../src/services/userService";
import { challengeService } from "../../src/services/challengeService";
import { notificationService } from "../../src/services/notificationService";
import ConfirmDialog from "../../src/components/ConfirmDialog";
import AvatarPicker from "../../src/components/AvatarPicker";
import { PRESET_AVATAR_SVG } from "../../src/assets/avatars/presetAvatars";
import { EN_FLAG_SVG, DE_FLAG_SVG } from "../../src/assets/flags";
import ShareModal from "../../src/components/ShareModal";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, dispatch } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  useEffect(() => {
    console.log("[Profile] user changed:", {
      id: user?.id,
      email: user?.email,
      avatarId: user?.avatarId,
      hasMatchingSvg: user?.avatarId ? Boolean(PRESET_AVATAR_SVG[user.avatarId]) : null,
    });
  }, [user]);

  const role = (user?.role || "").toLowerCase();
  const isBasicUser = role === "basic_user" || role === "";
  const status = (user?.status || "").toLowerCase();

  const [name, setName] = useState(user?.name || "");
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || "");
  const [address, setAddress] = useState(user?.address || "");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Whether anything the user could Save has actually changed, so the
  // button stays disabled on an untouched form instead of re-submitting
  // identical data — compares live field state directly against the
  // last-loaded `user`, matching web's ProfilePage.jsx isDirty check.
  const isDirty =
    name !== (user?.name || "") ||
    contactNumber !== (user?.contactNumber || "") ||
    (isBasicUser && address !== (user?.address || ""));

  const [streak, setStreak] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Streak/notifications are per-account — never call these auth-required
  // endpoints for a logged-out visitor (they'd just 401).
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        setStreak(null);
        setUnreadCount(0);
        return;
      }
      challengeService
        .getStreak()
        .then((result) => setStreak(result.currentStreak))
        .catch(() => setStreak(null));
      notificationService
        .getUnreadCount()
        .then(setUnreadCount)
        .catch(() => setUnreadCount(0));
    }, [isAuthenticated]),
  );

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const updated = await userService.updateMyProfile({
        name: name.trim() || undefined,
        contactNumber: contactNumber.trim() || undefined,
        address: isBasicUser ? address.trim() || undefined : undefined,
      });
      dispatch(setUser(updated));
      setSaveMessage("Profile updated!");
    } catch (error: any) {
      console.error("[Profile] updateMyProfile failed:", {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      setSaveMessage(
        error?.response?.data?.message ||
          "Could not update profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAvatar = async (avatarId: string) => {
    setSavingAvatar(true);
    setAvatarError(null);
    try {
      const updated = await userService.updateMyProfile({ avatarId });
      console.log("[Profile] avatar update response:", updated);
      dispatch(setUser(updated));
      setAvatarPickerOpen(false);
    } catch (error: any) {
      console.error("[Profile] avatar update failed:", {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      setAvatarError(
        error?.response?.data?.message ||
          "Could not update your avatar. Please try again.",
      );
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleShare = () => setShareModalOpen(true);

  const handleLogout = () => setLogoutConfirmOpen(true);

  const confirmLogout = async () => {
    setLogoutConfirmOpen(false);
    await dispatch(logout());
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4 dark:bg-slate-950">
      {user && (
        <View className="mb-6 rounded-2xl bg-white p-4 dark:bg-slate-900">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => setAvatarPickerOpen(true)}
              className="mr-4"
            >
              <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-sky-500">
                {user.avatarId && PRESET_AVATAR_SVG[user.avatarId] ? (
                  <SvgXml
                    xml={PRESET_AVATAR_SVG[user.avatarId]}
                    width={64}
                    height={64}
                  />
                ) : (
                  <Text className="text-2xl font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-700 dark:border-slate-900">
                <MaterialCommunityIcons name="pencil" size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900 dark:text-white">
                {user.name}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-slate-400">
                {user.email}
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row gap-2">
            {Boolean(role) && (
              <View className="rounded-full bg-sky-100 px-3 py-1 dark:bg-sky-900">
                <Text className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                  {role.replace("_", " ")}
                </Text>
              </View>
            )}
            {Boolean(status) && (
              <View className="rounded-full bg-emerald-100 px-3 py-1 dark:bg-emerald-900">
                <Text className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {status}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {!isAuthenticated && (
        <View className="mb-6 items-center rounded-2xl bg-white p-6 dark:bg-slate-900">
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={48}
            color={isDark ? "#64748B" : "#9CA3AF"}
          />
          <Text className="mb-1 mt-3 text-base font-bold text-gray-900 dark:text-white">
            You're not logged in
          </Text>
          <Text className="mb-4 text-center text-sm text-gray-500 dark:text-slate-400">
            Log in to save your profile, your progress, and join the leaderboard.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            className="mb-2 w-full items-center rounded-xl bg-orange-600 p-3"
          >
            <Text className="text-sm font-semibold text-white">Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/signup")}
            className="w-full items-center rounded-xl border border-orange-600 p-3"
          >
            <Text className="text-sm font-semibold text-orange-600">Create Account</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Editable profile fields — matches web's ProfilePage.jsx (name,
          contact number, address for BASIC_USER); photo upload is
          intentionally left out here since it needs a native image-picker
          dependency this project doesn't have yet. */}
      {isAuthenticated && (
        <View className="mb-6 rounded-2xl bg-white p-4 dark:bg-slate-900">
          <Text className="mb-3 text-xs font-semibold uppercase text-gray-400 dark:text-slate-500">
            Profile Settings
          </Text>

          <Text className="mb-1 text-xs font-medium text-gray-500 dark:text-slate-400">
            Full Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="mb-3 rounded-xl bg-gray-100 p-3 text-sm text-gray-900 dark:bg-slate-800 dark:text-white"
            placeholder="Your name"
            placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
          />

          <Text className="mb-1 text-xs font-medium text-gray-500 dark:text-slate-400">
            Contact Number
          </Text>
          <TextInput
            value={contactNumber}
            onChangeText={setContactNumber}
            className="mb-3 rounded-xl bg-gray-100 p-3 text-sm text-gray-900 dark:bg-slate-800 dark:text-white"
            placeholder="+49 1512 3456789"
            placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
            keyboardType="phone-pad"
          />

          {isBasicUser && (
            <>
              <Text className="mb-1 text-xs font-medium text-gray-500 dark:text-slate-400">
                Address
              </Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                className="mb-3 rounded-xl bg-gray-100 p-3 text-sm text-gray-900 dark:bg-slate-800 dark:text-white"
                placeholder="Your address"
                placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
              />
            </>
          )}

          {saveMessage && (
            <Text className="mb-2 text-xs text-gray-500 dark:text-slate-400">
              {saveMessage}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={saving || !isDirty}
            className="items-center rounded-xl bg-sky-500 p-3"
            style={{ opacity: saving || !isDirty ? 0.6 : 1 }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-sm font-semibold text-white">Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Quick links — mirrors web's NavBar profile dropdown. Not shown to
          guests at all: a logged-out visitor's Profile tab is just the
          login/register prompt plus Preferences, not a stripped-down copy
          of the full account page. */}
      {isAuthenticated && (
      <View className="mb-6">
        <Text className="mb-3 text-xs font-semibold uppercase text-gray-400 dark:text-slate-500">
          Quick Links
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/(app)/favorites")}
          className="mb-2 flex-row items-center justify-between rounded-xl bg-white p-4 dark:bg-slate-900"
        >
          <Text className="text-sm font-medium text-gray-800 dark:text-white">
            ❤️ Favorites
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={isDark ? "#64748B" : "#9CA3AF"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(app)/challenge")}
          className="mb-2 flex-row items-center justify-between rounded-xl bg-white p-4 dark:bg-slate-900"
        >
          <Text className="text-sm font-medium text-gray-800 dark:text-white">
            🎯 Daily Challenge
          </Text>
          <View className="flex-row items-center gap-2">
            {Boolean(streak) && streak! > 0 && (
              <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">
                🔥 {streak}
              </Text>
            )}
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={isDark ? "#64748B" : "#9CA3AF"}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(app)/challenge/leaderboard")}
          className="mb-2 flex-row items-center justify-between rounded-xl bg-white p-4 dark:bg-slate-900"
        >
          <Text className="text-sm font-medium text-gray-800 dark:text-white">
            🏆 Leaderboard
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={isDark ? "#64748B" : "#9CA3AF"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(app)/notifications")}
          className="mb-2 flex-row items-center justify-between rounded-xl bg-white p-4 dark:bg-slate-900"
        >
          <Text className="text-sm font-medium text-gray-800 dark:text-white">
            🔔 Notifications
          </Text>
          <View className="flex-row items-center gap-2">
            {unreadCount > 0 && (
              <View className="rounded-full bg-rose-500 px-2 py-0.5">
                <Text className="text-xs font-bold text-white">{unreadCount}</Text>
              </View>
            )}
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={isDark ? "#64748B" : "#9CA3AF"}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShare}
          className="mb-2 flex-row items-center justify-between rounded-xl bg-white p-4 dark:bg-slate-900"
        >
          <Text className="text-sm font-medium text-gray-800 dark:text-white">
            🔗 Share with Friends
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={isDark ? "#64748B" : "#9CA3AF"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            // Avoids a console warning if the Name/Contact/Address inputs
            // above still have focus when this pushes a new screen on top.
            Keyboard.dismiss();
            router.push("/(app)/contact");
          }}
          className="flex-row items-center justify-between rounded-xl bg-white p-4 dark:bg-slate-900"
        >
          <Text className="text-sm font-medium text-gray-800 dark:text-white">
            📧 Contact Us
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={isDark ? "#64748B" : "#9CA3AF"}
          />
        </TouchableOpacity>
      </View>
      )}

      <View className="mb-6">
        <Text className="mb-3 text-xs font-semibold uppercase text-gray-400 dark:text-slate-500">
          Preferences
        </Text>

        <View className="mb-3 flex-row items-center justify-between rounded-xl bg-gray-100 p-5 dark:bg-slate-900">
          <Text className="text-sm font-medium text-gray-800 dark:text-white">
            🌐 {t("navbar.language")}
          </Text>
          <TouchableOpacity
            onPress={toggleLanguage}
            activeOpacity={0.7}
            style={{
              marginRight: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View style={{ opacity: language === "en" ? 1 : 0.4, justifyContent: "center" }}>
              <SvgXml xml={EN_FLAG_SVG} width={26} height={16} />
            </View>
            <MaterialCommunityIcons
              name={language === "en" ? "toggle-switch-off" : "toggle-switch"}
              size={30}
              color="#38bdf8"
              style={{ marginTop: 1 }}
            />
            <View style={{ opacity: language === "de" ? 1 : 0.4, justifyContent: "center" }}>
              <SvgXml xml={DE_FLAG_SVG} width={26} height={16} />
            </View>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-between rounded-xl bg-gray-100 p-5 dark:bg-slate-900">
          <Text className="text-sm font-medium text-gray-800 dark:text-white">
            🎨 Appearance
          </Text>
          <TouchableOpacity
            onPress={toggleTheme}
            activeOpacity={0.7}
            className="rounded-full p-3.5"
            style={[styles.cyanPill, { marginRight: 14 }]}
          >
            <MaterialCommunityIcons
              name={theme === "light" ? "weather-night" : "weather-sunny"}
              size={22}
              color={theme === "light" ? "#EAB308" : "#FFFFFF"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Web keeps Logout only in its NavBar's avatar dropdown, never on the
          Profile/Dashboard page itself — but mobile has no separate nav
          dropdown surface, so Profile is the only place it can reasonably
          live here. */}
      {isAuthenticated && (
        <TouchableOpacity
          onPress={handleLogout}
          className="mb-8 items-center rounded-xl bg-rose-500 p-4"
        >
          <Text className="text-base font-semibold text-white">
            {t("navbar.logout")}
          </Text>
        </TouchableOpacity>
      )}

      <ConfirmDialog
        visible={logoutConfirmOpen}
        title={t("navbar.logout")}
        message="Are you sure you want to log out?"
        confirmLabel={t("navbar.logout")}
        cancelLabel="Cancel"
        onConfirm={confirmLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
        confirmFirst
      />

      <AvatarPicker
        visible={avatarPickerOpen}
        selectedAvatarId={user?.avatarId}
        saving={savingAvatar}
        error={avatarError}
        onSelect={handleSelectAvatar}
        onClose={() => {
          setAvatarPickerOpen(false);
          setAvatarError(null);
        }}
      />

      <ShareModal visible={shareModalOpen} onClose={() => setShareModalOpen(false)} />
    </ScrollView>
  );
}

// Matches web NavBar.jsx's theme toggle button exactly (bg-cyan-900,
// border-gray-700/50) — same dark pill look regardless of the app's own
// light/dark theme, since web's navbar toggle button never changes color
// when the site theme is switched.
const styles = StyleSheet.create({
  cyanPill: {
    backgroundColor: "#164E63",
    borderWidth: 1,
    borderColor: "rgba(107, 114, 128, 0.5)",
  },
});
