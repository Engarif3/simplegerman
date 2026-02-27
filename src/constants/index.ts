export const COLORS = {
  PRIMARY: "#FF6B6B",
  SECONDARY: "#4ECDC4",
  SUCCESS: "#2EDC71",
  ERROR: "#C41E3A",
  DARK: "#333333",
  GRAY: "#666666",
  LIGHT_GRAY: "#F5F5F5",
  BORDER: "#EEEEEE",
  WHITE: "#FFFFFF",
};

export const API_CONFIG = {
  TIMEOUT: 15000,
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001/api",
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER: "user_data",
};
