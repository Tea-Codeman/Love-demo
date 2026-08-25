const { getTaskById, saveTask, getReminderByTask, addReminder, respondReminder, logEvent } = require('../../utils/store');

Page({
  data: {
    task: null,
    aText: '',
    bText: '',
    bothDone: false,
    reminded: false
  },
  onLoad(options) {
    const task = getTaskById(options.id);
    this.setData({
      task,
      aText: task.aContent || '',
      bText: task.bContent || '',
      bothDone: task.aDone && task.bDone,
      reminded: !!getReminderByTask(options.id)
    });
    wx.setNavigationBarTitle({ title: task.name });
  },
  onAInput(e) {
    this.setData({ aText: e.detail.value });
  },
  onBInput(e) {
    this.setData({ bText: e.detail.value });
  },
  completeA() {
    if (!this.data.aText.trim()) {
      wx.showToast({ title: '先写点什么吧', icon: 'none' });
      return;
    }
    const task = this.data.task;
    task.aDone = true;
    task.aContent = this.data.aText;
    this.afterUpdate(task);
  },
  completeB() {
    if (!this.data.bText.trim()) {
      wx.showToast({ title: '先写点什么吧', icon: 'none' });
      return;
    }
    const task = this.data.task;
    task.bDone = true;
    task.bContent = this.data.bText;
    this.afterUpdate(task);
  },
  afterUpdate(task) {
    task.progress = (task.aDone && task.bDone) ? 100 : ((task.aDone || task.bDone) ? 50 : 0);
    task.status = task.progress === 100 ? 'done' : (task.progress === 50 ? 'doing' : 'todo');
    saveTask(task);
    this.setData({ task, bothDone: task.aDone && task.bDone });
    if (task.progress === 100) {
      logEvent('task_complete', { id: task.id, name: task.name });
      wx.showToast({ title: '任务 100% 完成！', icon: 'success' });
    } else if (task.progress === 50) {
      wx.showToast({ title: '等待 TA 的回应…', icon: 'none' });
    }
  },
  remindTA() {
    const task = this.data.task;
    if (task.progress === 100) {
      wx.showToast({ title: '任务已完成啦', icon: 'none' });
      return;
    }
    addReminder(task.id);
    logEvent('remind', { id: task.id, name: task.name });
    this.setData({ reminded: true });
    wx.showToast({ title: '已提醒 TA 💌', icon: 'none' });
  },
  // 本机模拟「TA 在另一台设备完成了 TA 的部分」并触发同步
  simulateResponse() {
    const task = this.data.task;
    if (task.bDone) {
      wx.showToast({ title: 'TA 已经完成了', icon: 'none' });
      return;
    }
    task.bDone = true;
    if (!task.bContent) task.bContent = '收到～我来啦';
    respondReminder(task.id);
    this.setData({ reminded: false });
    this.afterUpdate(task);
  },
  goComplete() {
    wx.redirectTo({ url: '/pages/complete/complete?id=' + this.data.task.id });
  }
});
