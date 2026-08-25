const { ensureTasks, getCP } = require('../../utils/store');

Page({
  data: {
    bound: false,
    tasks: []
  },
  onShow() {
    const cp = getCP();
    if (!cp) {
      this.setData({ bound: false, tasks: [] });
      return;
    }
    this.setData({ bound: true, tasks: ensureTasks() });
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + id });
  }
});
