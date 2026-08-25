const { getCP } = require('./utils/store');

App({
  globalData: {
    cp: null
  },
  onLaunch() {
    // 启动时把本机 CP 信息读入全局，方便各页面快速取用
    this.globalData.cp = getCP();
  }
});
