import React from "react";
import { ScrollView } from "react-native";
import ScreenHeader from "../../src/components/ScreenHeader";
import ContactForm from "../../src/components/ContactForm";

export default function ContactScreen() {
  return (
    <ScrollView
      className="flex-1 bg-white p-4 dark:bg-slate-950"
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader title="📧 Contact Us" />
      <ContactForm />
    </ScrollView>
  );
}
