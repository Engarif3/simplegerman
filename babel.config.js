module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins: [
      // NOTE: do not add @babel/plugin-transform-react-jsx here — it
      // re-applies the plain React JSX transform *after* the presets above,
      // which silently overwrites NativeWind's "nativewind" jsxImportSource
      // and breaks every className prop in the app back to a no-op (this is
      // exactly what happened before this was removed).
      "@babel/plugin-transform-export-namespace-from",
      "react-native-reanimated/plugin",
    ],
  };
};
