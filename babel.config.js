module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      require.resolve("expo-router/babel"),
      [
        "module-resolver",
        {
          alias: {
            "@assets": "./assets",
            "@atoms": "./atoms",
            "@components": "./components",
            "@constants": "./constants",
            "@screens": "./screens",
            "@styles": "./styles",
            "@types": "./types",
            "@utils": "./utils",
          },
        },
      ],
    ],
  };
};
