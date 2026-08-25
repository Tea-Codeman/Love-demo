const { getTasks, getCP } = require('../../utils/store');
const app = getApp();

Page({
  data: {
    cp: null,
    cards: []
  },
  onShow() {
    const cp = getCP();
    app.globalData.cp = cp;
    const tasks = getTasks() || [];
    const cards = tasks
      .filter(t => t.archived)
      .map(t => ({
        id: t.id,
        name: t.name,
        quote: t.cardQuote || '今天也要一起加油呀 💕',
        privacy: t.cardPrivacy || '仅情侣可见',
        aContent: t.aContent,
        bContent: t.bContent,
        aNick: cp ? cp.selfNick : '我',
        bNick: cp ? cp.partnerNick : 'TA'
      }));
    this.setData({ cp, cards });
  },
  goBack() {
    wx.navigateBack();
  }
});
