const { setCP, logEvent } = require('../../utils/store');
const app = getApp();

Page({
  data: {
    selfNick: '',
    partnerNick: 'TA'
  },
  onInputSelf(e) {
    this.setData({ selfNick: e.detail.value });
  },
  onInputPartner(e) {
    this.setData({ partnerNick: e.detail.value });
  },
  onCreate() {
    const selfNick = (this.data.selfNick || '').trim() || '我';
    const partnerNick = (this.data.partnerNick || '').trim() || 'TA';
    const cp = {
      cpId: 'cp_' + Date.now(),
      selfNick,
      partnerNick,
      intimacy: 0,
      growth: 0,
      createdAt: new Date().toISOString()
    };
    setCP(cp);
    app.globalData.cp = cp;
    logEvent('cp_bind', { selfNick, partnerNick });
    wx.showToast({ title: 'CP 已绑定', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 800);
  }
});
