const { getTaskById, getCP, saveTask, logEvent } = require('../../utils/store');
const { PRIVACY_OPTIONS } = require('../../utils/constants');

function loveDays(createdAt) {
  const start = new Date(createdAt).getTime();
  return Math.max(1, Math.floor((Date.now() - start) / 86400000));
}

Page({
  data: {
    task: null,
    cp: null,
    loveDays: 0,
    quote: '',
    privacyIndex: 2,
    privacyOptions: PRIVACY_OPTIONS
  },
  onLoad(options) {
    const task = getTaskById(options.id);
    const cp = getCP();
    const days = loveDays(cp.createdAt);
    const quote = task.cardQuote || '今天也要一起加油呀 💕';
    this.setData({
      task,
      cp,
      loveDays: days,
      quote,
      privacyIndex: PRIVACY_OPTIONS.indexOf(task.cardPrivacy) >= 0 ? PRIVACY_OPTIONS.indexOf(task.cardPrivacy) : 2
    });
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] });
  },
  onQuoteInput(e) {
    this.setData({ quote: e.detail.value });
  },
  onPrivacyChange(e) {
    this.setData({ privacyIndex: Number(e.detail.value) });
  },
  finish() {
    const task = this.data.task;
    // 生成兜底：金句或双方内容缺失时自动补齐，保证始终能生成一张完整纪念卡
    const quote = (this.data.quote && this.data.quote.trim()) || task.cardQuote || '今天也要一起加油呀 💕';
    task.cardQuote = quote;
    task.cardPrivacy = this.data.privacyOptions[this.data.privacyIndex];
    if (!task.aContent) task.aContent = '（留白也是一种浪漫）';
    if (!task.bContent) task.bContent = '（留白也是一种浪漫）';
    task.cardGenerated = true;
    task.archived = true;
    saveTask(task);
    logEvent('card_generated', {
      id: task.id,
      name: task.name,
      quote,
      privacy: task.cardPrivacy,
      fallback: !this.data.quote || !task.aContent || !task.bContent
    });
    wx.showToast({ title: '已归档私密纪念册', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 900);
  },
  onShareAppMessage() {
    logEvent('share', { type: 'appMessage', name: this.data.task.name });
    return {
      title: this.data.cp.selfNick + ' 和 ' + this.data.cp.partnerNick + ' 完成了「' + this.data.task.name + '」',
      path: '/pages/index/index'
    };
  },
  onShareTimeline() {
    logEvent('share', { type: 'timeline', name: this.data.task.name });
    return {
      title: '我们的 CP 纪念卡 💕',
      query: ''
    };
  }
});
