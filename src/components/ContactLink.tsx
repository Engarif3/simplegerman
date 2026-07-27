import React from "react";
import { View, Text, TouchableOpacity, Keyboard } from "react-native";
import { useRouter } from "expo-router";

export default function ContactLink({ disabled }: { disabled?: boolean }) {
  const router = useRouter();

  const handlePress = () => {
    // If an email/password field on the current screen still has focus,
    // React Navigation marks this screen aria-hidden the moment Contact is
    // pushed on top — while the input underneath is still focused. Browsers
    // correctly refuse that (a focused element can't be hidden from
    // assistive tech) and log a console warning. Blurring first avoids it.
    Keyboard.dismiss();
    router.push("/(auth)/contact");
  };

  return (
    <View className="mt-6 flex-row items-center justify-center">
      <Text className="text-sm text-gray-500 dark:text-slate-400">
        Need help?{" "}
      </Text>
      <TouchableOpacity onPress={handlePress} disabled={disabled}>
        <Text className="text-sm font-semibold text-orange-600">Contact Us</Text>
      </TouchableOpacity>
    </View>
  );
}
