import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useTheme } from "../context/ThemeContext";

// Same EmailJS service/template/public key web's Contact.jsx uses — these
// are client-embedded values (already shipped in the web bundle), not
// secrets, so reusing them here keeps both apps sending to the same inbox
// without needing a backend endpoint (the web contact form has never had
// one either).
const EMAILJS_SERVICE_ID = "service_kzff0fs";
const EMAILJS_TEMPLATE_ID = "template_opsy1so";
const EMAILJS_PUBLIC_KEY = "JYmbcbb9qXSLOn_sQ";

export default function ContactForm() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || message.trim().length < 10) {
      Alert.alert(
        "Missing info",
        "Please fill in your name, email, and a message of at least 10 characters.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: { name: name.trim(), email: email.trim(), message: message.trim() },
        }),
      });

      if (!response.ok) throw new Error(`EmailJS responded ${response.status}`);

      Alert.alert("Message sent!", "Thank you for reaching out — we'll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      Alert.alert(
        "Something went wrong",
        "Could not send your message right now. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Text className="mb-6 text-center text-sm text-gray-500 dark:text-slate-400">
        Questions, feedback, or want to collaborate? Send us a message.
      </Text>

      <View className="mb-6 rounded-2xl bg-gray-50 p-4 dark:bg-slate-900">
        <Text className="mb-1 text-xs font-medium text-gray-500 dark:text-slate-400">
          Your Name
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          editable={!isSubmitting}
          className="mb-3 rounded-xl bg-white p-3 text-sm text-gray-900 dark:bg-slate-800 dark:text-white"
          placeholder="Your name"
          placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
        />

        <Text className="mb-1 text-xs font-medium text-gray-500 dark:text-slate-400">
          Your Email
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          editable={!isSubmitting}
          className="mb-3 rounded-xl bg-white p-3 text-sm text-gray-900 dark:bg-slate-800 dark:text-white"
          placeholder="your@email.com"
          placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text className="mb-1 text-xs font-medium text-gray-500 dark:text-slate-400">
          Message
        </Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          editable={!isSubmitting}
          className="mb-1 rounded-xl bg-white p-3 text-sm text-gray-900 dark:bg-slate-800 dark:text-white"
          placeholder="Tell us what's on your mind..."
          placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={{ minHeight: 120 }}
        />
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isSubmitting}
        className="mb-8 items-center rounded-xl bg-orange-600 p-4"
        style={{ opacity: isSubmitting ? 0.6 : 1 }}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-semibold text-white">Send Message</Text>
        )}
      </TouchableOpacity>
    </>
  );
}
