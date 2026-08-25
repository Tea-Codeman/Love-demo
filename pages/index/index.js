const { getCP, getTasks } = require('../../utils/store');
const app = getApp();

function loveDays(createdAt) {
  const start = new Date(createdAt).getTime();
  return Math.max(1, Math.floor((Date.now() - start) / 86400000));
}

Page({
  data: {
    cp: null,
    loveDays: 0,
    doneCount: 0
  },
  onShow() {
    const cp = getCP();
    app.globalData.cp = cp;
    let days = 0;
    let doneCount = 0;
    if (cp) {
      days = loveDays(cp.createdAt);
      const tasks = getTasks() || [];
      doneCount = tasks.filter(t => t.status === 'done').length;
    }
    this.setData({ cp, loveDays: days, doneCount });
  },
  goBind() {
    wx.navigateTo({ url: '/pages/bind/bind' });
  },
  goTasks() {
    wx.navigateTo({ url: '/pages/tasks/tasks' });
  },
  unbind() {
    wx.showModal({
      title: '解除 CP 关系',
      content: '解除后本机 CP 数据与任务进度将清空（仅本机演示，不影响真实账号）。',
      confirmColor: '#ff6b81',
      success: (r) => {
        if (r.confirm) {
          wx.removeStorageSync('cp_info');
          wx.removeStorageSync('cp_tasks');
          app.globalData.cp = null;
          this.setData({ cp: null, loveDays: 0, doneCount: 0 });
        }
      }
    });
  }
});
