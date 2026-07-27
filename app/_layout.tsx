import "../global.css";
import "../src/i18n";
import React, { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Provider } from "react-redux";
import { Slot } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { store } from "../src/redux/store";
import { useAppDispatch } from "../src/hooks/useAppHooks";
import { restoreSession } from "../src/redux/authSlice";
import { ThemeProvider } from "../src/context/ThemeContext";
import { LanguageProvider } from "../src/context/LanguageContext";
import { RadioPlayerProvider } from "../src/context/RadioPlayerContext";
import RadioMiniPlayer from "../src/components/RadioMiniPlayer";

SplashScreen.preventAutoHideAsync();

// Restoring the session here (rather than only in app/index.tsx) matters on
// web: hitting/refreshing any URL other than "/" (e.g. /favorites,
// /vocabulary) mounts that route directly and never renders Index, so a
// restoreSession() dispatched only there would never run — leaving
// state.auth.user null for the whole session even with a valid stored
// token. This layout wraps every route, auth and app alike, so it always
// runs exactly once per app load regardless of the entry URL.
function SessionGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    dispatch(restoreSession()).finally(() => setIsRestored(true));
  }, [dispatch]);

  if (!isRestored) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <RadioPlayerProvider>
              <SessionGate>
                <Slot />
                <RadioMiniPlayer />
              </SessionGate>
            </RadioPlayerProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
