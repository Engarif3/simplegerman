import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import ContactForm from "../../src/components/ContactForm";

export default function AuthContactScreen() {
  const router = useRouter();

  return (
    <ScrollView
      className="flex-1 bg-white p-6 dark:bg-slate-950"
      contentContainerStyle={{ justifyContent: "center", minHeight: "100%" }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-2xl text-gray-900 dark:text-white">‹</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-center text-xl font-bold text-gray-900 dark:text-white">
          📧 Contact Us
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ContactForm />
    </ScrollView>
  );
}
