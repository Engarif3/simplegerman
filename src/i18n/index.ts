import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import commonEn from "../locales/en/common.json";
import commonDe from "../locales/de/common.json";

export const LANGUAGE_STORAGE_KEY = "language";
export type AppLanguage = "en" | "de";

const resources = {
  en: { common: commonEn },
  de: { common: commonDe },
};

const deviceLanguage: AppLanguage =
  Localization.getLocales()[0]?.languageCode === "de" ? "de" : "en";

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage,
  fallbackLng: "en",
  supportedLngs: ["en", "de"],
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  ns: ["common"],
  defaultNS: "common",
});

export const loadPersistedLanguage = async () => {
  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === "en" || stored === "de") {
    await i18n.changeLanguage(stored);
  }
};

export const setAppLanguage = async (language: AppLanguage) => {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
};

export default i18n;
