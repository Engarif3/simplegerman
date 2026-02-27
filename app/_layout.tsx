import React, { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Provider } from "react-redux";
import { Slot } from "expo-router";
import { store } from "../src/redux/store";

SplashScreen.preventAutoHideAsync();

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
      <Slot />
    </Provider>
  );
}
