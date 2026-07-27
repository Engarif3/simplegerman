import React, { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AppLanguage,
  loadPersistedLanguage,
  setAppLanguage,
} from "../i18n";

type LanguageContextValue = {
  language: AppLanguage;
  isReady: boolean;
  toggleLanguage: () => void;
  setLanguageTo: (lang: AppLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const { i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadPersistedLanguage().finally(() => setIsReady(true));
  }, []);

  const language: AppLanguage = i18n.resolvedLanguage === "de" ? "de" : "en";

  const toggleLanguage = () => {
    setAppLanguage(language === "en" ? "de" : "en");
  };

  const setLanguageTo = (lang: AppLanguage) => {
    setAppLanguage(lang);
  };

  return (
    <LanguageContext.Provider
      value={{ language, isReady, toggleLanguage, setLanguageTo }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
};
