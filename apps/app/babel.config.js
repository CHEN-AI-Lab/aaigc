// babel-preset-expo 已包含 TypeScript / JSX / Expo Router / EXPO_PUBLIC_* 内联，
// 因此这里不需要额外插件。不要往这里加任何路径或地址常量。
module.exports = function babelConfig(api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
  }
}
