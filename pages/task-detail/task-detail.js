const { getTaskById, saveTask } = require('../../utils/store');

Page({
  data: {
    task: null,
    aText: '',
    bText: '',
    bothDone: false
  },
  onLoad(options) {
    const task = getTaskById(options.id);
    this.setData({
      task,
      aText: task.aContent || '',
      bText: task.bContent || '',
      bothDone: task.aDone && task.bDone
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
      wx.showToast({ title: '任务 100% 完成！', icon: 'success' });
    } else if (task.progress === 50) {
      wx.showToast({ title: '等待 TA 的回应…', icon: 'none' });
    }
  },
  remindTA() {
    wx.showToast({ title: '已提醒 TA（演示）', icon: 'none' });
  },
  goComplete() {
    wx.redirectTo({ url: '/pages/complete/complete?id=' + this.data.task.id });
  }
});
