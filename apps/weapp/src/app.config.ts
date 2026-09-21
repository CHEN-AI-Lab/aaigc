export default defineAppConfig({
  pages: ['pages/index/index', 'pages/me/index', 'pages/login/index', 'pages/tool/index'],
  window: {
    backgroundTextStyle: 'light',
    backgroundColor: '#fffaeb',
    navigationBarBackgroundColor: '#fffaeb',
    navigationBarTitleText: 'AAIGC',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#767d88',
    selectedColor: '#fa520f',
    backgroundColor: '#fffaeb',
    borderStyle: 'white',
    // tabBar 的文案在运行期由 app.tsx 按当前 locale 覆写（Taro.setTabBarItem）——
    // app.config 是构建期求值的，拿不到运行期语言。
    list: [
      {
        pagePath: 'pages/index/index',
        text: '工具',
        iconPath: 'assets/tabbar/tools.png',
        selectedIconPath: 'assets/tabbar/tools-active.png',
      },
      {
        pagePath: 'pages/me/index',
        text: '我的',
        iconPath: 'assets/tabbar/me.png',
        selectedIconPath: 'assets/tabbar/me-active.png',
      },
    ],
  },
})
