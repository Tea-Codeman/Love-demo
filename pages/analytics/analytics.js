const { getEvents, getCP, clearEvents } = require('../../utils/store');
const app = getApp();

const LABELS = {
  cp_bind: '建立 CP 关系',
  task_complete: '完成任务',
  reward: '获得奖励',
  card_generated: '生成纪念卡',
  share: '分享纪念卡',
  remind: '提醒 TA'
};

function fmt(iso) {
  const d = new Date(iso);
  const p = n => (n < 10 ? '0' + n : '' + n);
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
    p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

function summarize(e) {
  const p = e.payload || {};
  switch (e.type) {
    case 'cp_bind': return (p.selfNick || '') + ' & ' + (p.partnerNick || '');
    case 'task_complete': return p.name || '';
    case 'reward': return '亲密度+' + (p.intimacy || 0) + ' 成长值+' + (p.growth || 0);
    case 'card_generated': return (p.name || '') + ' · ' + (p.privacy || '');
    case 'share': return (p.type === 'timeline' ? '分享到朋友圈' : '分享给好友') + ' · ' + (p.name || '');
    case 'remind': return p.name || '';
    default: return '';
  }
}

Page({
  data: {
    events: [],
    empty: true
  },
  onShow() {
    const cp = getCP();
    app.globalData.cp = cp;
    const events = getEvents().slice().reverse().map(e => ({
      type: e.type,
      label: LABELS[e.type] || e.type,
      detail: summarize(e),
      time: fmt(e.at)
    }));
    this.setData({ events, empty: events.length === 0 });
  },
  clear() {
    clearEvents();
    this.setData({ events: [], empty: true });
  },
  goBack() {
    wx.navigateBack();
  }
});
