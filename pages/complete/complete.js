const { getTaskById, saveTask, getCP, setCP } = require('../../utils/store');
const app = getApp();

Page({
  data: {
    task: null,
    intimacy: 0,
    growth: 0
  },
  onLoad(options) {
    const task = getTaskById(options.id);
    const cp = getCP();
    // 奖励只在首次到达 100% 时发放，避免重复进入重复加值
    if (!task.rewardGiven) {
      cp.intimacy += (task.reward.intimacy || 0);
      cp.growth += (task.reward.growth || 0);
      setCP(cp);
      task.rewardGiven = true;
      saveTask(task);
      app.globalData.cp = cp;
    }
    this.setData({ task, intimacy: cp.intimacy, growth: cp.growth });
  },
  goCard() {
    wx.redirectTo({ url: '/pages/card/card?id=' + this.data.task.id });
  }
});
