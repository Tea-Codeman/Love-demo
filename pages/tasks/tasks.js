const { ensureTasks, getCP, getReminders } = require('../../utils/store');

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
    const reminders = getReminders();
    const tasks = ensureTasks().map(t => Object.assign({}, t, {
      reminded: !!reminders.find(r => r.taskId === t.id && r.status === 'pending')
    }));
    this.setData({ bound: true, tasks });
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + id });
  }
});
