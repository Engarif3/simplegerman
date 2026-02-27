module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
      "@babel/plugin-transform-export-namespace-from",
      "react-native-reanimated/plugin",
    ],
  };
};
