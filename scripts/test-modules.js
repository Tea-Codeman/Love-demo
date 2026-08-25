// 分模块单元测试：在 Node 里模拟微信环境，逐个加载页面并断言其行为。
// 运行：node scripts/test-modules.js
const path = require('path');
const { wx, loadPage, resetStorage, getApp } = require('./wx-mock');

const ROOT = 'D:/Tencent/love_demo';
const P = (p) => path.join(ROOT, p).replace(/\\/g, '/');

let pass = 0, fail = 0;
const failures = [];
function test(name, fn) {
  try { fn(); pass++; console.log('  \u2713 ' + name); }
  catch (e) { fail++; failures.push(name + ' -> ' + e.message); console.log('  \u2717 ' + name + ' -> ' + e.message); }
}
function eq(a, b, msg) {
  if (a !== b) throw new Error((msg ? msg + ': ' : '') + '期望 ' + JSON.stringify(b) + ' 实际 ' + JSON.stringify(a));
}
function ok(v, msg) { if (!v) throw new Error(msg || '期望为真'); }
function moduleStart(m) { console.log('\n[模块] ' + m); }

// ---------------- M1 CP 绑定 ----------------
moduleStart('M1 CP绑定 (pages/bind)');
resetStorage();
test('未绑定时 storage 中没有 cp_info', () => {
  eq(wx.getStorageSync('cp_info'), '', '应为空字符串');
});
test('输入昵称并绑定后写入 CP 与 globalData', () => {
  const p = loadPage(P('pages/bind/bind.js'));
  p.onInputSelf({ detail: { value: '小明' } });
  p.onInputPartner({ detail: { value: '小红' } });
  p.onCreate();
  const cp = getApp().globalData.cp;
  ok(cp && cp.cpId, '应生成 cpId');
  eq(cp.selfNick, '小明');
  eq(cp.partnerNick, '小红');
  eq(cp.intimacy, 0);
  eq(cp.growth, 0);
  const stored = wx.getStorageSync('cp_info');
  ok(stored && stored.cpId, '应写入 storage');
});
test('空昵称时使用默认值 我 / TA', () => {
  resetStorage();
  const p = loadPage(P('pages/bind/bind.js'));
  p.onCreate();
  const cp = getApp().globalData.cp;
  eq(cp.selfNick, '我');
  eq(cp.partnerNick, 'TA');
});

// ---------------- M2 首页 / 成长空间 ----------------
moduleStart('M2 首页/成长空间 (pages/index)');
resetStorage();
test('未绑定时 cp 为 null 且数据清空', () => {
  const p = loadPage(P('pages/index/index.js'));
  p.onShow();
  eq(p.data.cp, null);
  eq(p.data.loveDays, 0);
  eq(p.data.doneCount, 0);
});
test('绑定后展示恋爱天数与完成任务数', () => {
  const bind = loadPage(P('pages/bind/bind.js'));
  bind.onCreate();
  const p = loadPage(P('pages/index/index.js'));
  p.onShow();
  ok(p.data.cp, 'cp 应非空');
  ok(p.data.loveDays >= 1, '恋爱天数至少 1');
  eq(p.data.doneCount, 0);
});
test('解除绑定后清零本机数据', () => {
  const bind = loadPage(P('pages/bind/bind.js'));
  bind.onCreate();
  const p = loadPage(P('pages/index/index.js'));
  p.unbind(); // showModal 模拟返回 confirm=true
  eq(wx.getStorageSync('cp_info'), '', 'cp_info 应被清除');
  eq(wx.getStorageSync('cp_tasks'), '', 'cp_tasks 应被清除');
  eq(p.data.cp, null);
});

// ---------------- M3 任务列表 ----------------
moduleStart('M3 任务列表 (pages/tasks)');
resetStorage();
test('未绑定时任务列表为空', () => {
  const p = loadPage(P('pages/tasks/tasks.js'));
  p.onShow();
  eq(p.data.bound, false);
  eq(p.data.tasks.length, 0);
});
test('绑定后按模板初始化任务列表', () => {
  loadPage(P('pages/bind/bind.js')).onCreate();
  const p = loadPage(P('pages/tasks/tasks.js'));
  p.onShow();
  eq(p.data.bound, true);
  ok(p.data.tasks.length >= 1, '至少 1 个任务');
  eq(p.data.tasks[0].status, 'todo');
  eq(p.data.tasks[0].progress, 0);
});

// ---------------- M4 任务协作（详情） ----------------
moduleStart('M4 任务协作详情 (pages/task-detail)');
resetStorage();
test('单方完成时进度 50% 且状态 doing', () => {
  loadPage(P('pages/bind/bind.js')).onCreate();
  const p = loadPage(P('pages/task-detail/task-detail.js'));
  p.onLoad({ id: 't_goodnight' });
  p.onAInput({ detail: { value: '晚安' } });
  p.completeA();
  eq(p.data.task.progress, 50, '单方应为 50%');
  eq(p.data.task.status, 'doing');
  eq(p.data.task.aDone, true);
  eq(p.data.bothDone, false);
});
test('双方完成时进度 100% 且状态 done', () => {
  const p = loadPage(P('pages/task-detail/task-detail.js'));
  p.onLoad({ id: 't_goodnight' });
  p.onAInput({ detail: { value: '晚安' } });
  p.completeA();
  p.onBInput({ detail: { value: '好梦' } });
  p.completeB();
  eq(p.data.task.progress, 100, '双方应为 100%');
  eq(p.data.task.status, 'done');
  eq(p.data.bothDone, true);
});
test('未填写内容时不允许完成', () => {
  resetStorage();
  loadPage(P('pages/bind/bind.js')).onCreate();
  const p = loadPage(P('pages/task-detail/task-detail.js'));
  p.onLoad({ id: 't_goodnight' }); // 全新任务，aText=''
  p.completeA(); // aText 为空
  eq(p.data.task.aDone, false, '空内容不应完成');
  eq(p.data.task.progress, 0);
});

// ---------------- M5 完成判定 + 奖励 ----------------
moduleStart('M5 完成判定与奖励 (pages/complete)');
resetStorage();
test('首次到达 100% 发放奖励并标记，重复进入不重复加', () => {
  loadPage(P('pages/bind/bind.js')).onCreate();
  const detail = loadPage(P('pages/task-detail/task-detail.js'));
  detail.onLoad({ id: 't_goodnight' });
  detail.onAInput({ detail: { value: '晚安' } }); detail.completeA();
  detail.onBInput({ detail: { value: '好梦' } }); detail.completeB();
  const c1 = loadPage(P('pages/complete/complete.js'));
  c1.onLoad({ id: 't_goodnight' });
  const intimacyAfter1 = getApp().globalData.cp.intimacy;
  const growthAfter1 = getApp().globalData.cp.growth;
  eq(intimacyAfter1, 10, '亲密度 +10');
  eq(growthAfter1, 5, '成长值 +5');
  eq(c1.data.task.rewardGiven, true);
  // 再次进入不应重复加
  const c2 = loadPage(P('pages/complete/complete.js'));
  c2.onLoad({ id: 't_goodnight' });
  eq(getApp().globalData.cp.intimacy, 10, '重复进入不重复加');
  eq(getApp().globalData.cp.growth, 5);
});

// ---------------- M6 纪念卡（编辑/分享/隐私/归档） ----------------
moduleStart('M6 纪念卡 (pages/card)');
resetStorage();
function bindWithNames(a, b) {
  const bind = loadPage(P('pages/bind/bind.js'));
  bind.onInputSelf({ detail: { value: a } });
  bind.onInputPartner({ detail: { value: b } });
  bind.onCreate();
}
test('编辑金句、调整隐私权限、完成时归档并生成卡片', () => {
  bindWithNames('小明', '小红');
  const detail = loadPage(P('pages/task-detail/task-detail.js'));
  detail.onLoad({ id: 't_goodnight' });
  detail.onAInput({ detail: { value: '晚安' } }); detail.completeA();
  detail.onBInput({ detail: { value: '好梦' } }); detail.completeB();
  loadPage(P('pages/complete/complete.js')).onLoad({ id: 't_goodnight' });
  const card = loadPage(P('pages/card/card.js'));
  card.onLoad({ id: 't_goodnight' });
  ok(card.data.loveDays >= 1);
  card.onQuoteInput({ detail: { value: '我们的第一张纪念卡' } });
  card.onPrivacyChange({ detail: { value: '1' } }); // 好友可见
  eq(card.data.privacyOptions[card.data.privacyIndex], '好友可见');
  card.finish();
  const stored = wx.getStorageSync('cp_tasks').find(x => x.id === 't_goodnight');
  eq(stored.cardQuote, '我们的第一张纪念卡');
  eq(stored.cardPrivacy, '好友可见');
  eq(stored.cardGenerated, true);
  eq(stored.archived, true);
});
test('分享配置包含双方昵称与任务名', () => {
  resetStorage();
  bindWithNames('小明', '小红');
  const detail = loadPage(P('pages/task-detail/task-detail.js'));
  detail.onLoad({ id: 't_goodnight' });
  detail.onAInput({ detail: { value: '晚安' } }); detail.completeA();
  detail.onBInput({ detail: { value: '好梦' } }); detail.completeB();
  loadPage(P('pages/complete/complete.js')).onLoad({ id: 't_goodnight' });
  const card = loadPage(P('pages/card/card.js'));
  card.onLoad({ id: 't_goodnight' });
  const msg = card.onShareAppMessage();
  ok(msg.title.indexOf('小明') >= 0 && msg.title.indexOf('小红') >= 0, '分享标题含双方昵称');
  ok(msg.title.indexOf('今日晚安打卡') >= 0, '分享标题含任务名');
});

// ---------------- M7 私密纪念册 ----------------
moduleStart('M7 私密纪念册 (pages/album)');
resetStorage();
test('未归档时纪念册列表为空', () => {
  bindWithNames('小明', '小红');
  const p = loadPage(P('pages/album/album.js'));
  p.onShow();
  eq(p.data.cards.length, 0, '无归档卡片时应为空');
});
test('完成任务并归档后，纪念册出现该卡片', () => {
  const detail = loadPage(P('pages/task-detail/task-detail.js'));
  detail.onLoad({ id: 't_goodnight' });
  detail.onAInput({ detail: { value: '晚安' } }); detail.completeA();
  detail.onBInput({ detail: { value: '好梦' } }); detail.completeB();
  loadPage(P('pages/complete/complete.js')).onLoad({ id: 't_goodnight' });
  const card = loadPage(P('pages/card/card.js'));
  card.onLoad({ id: 't_goodnight' });
  card.onQuoteInput({ detail: { value: '我们的纪念' } });
  card.finish();
  const album = loadPage(P('pages/album/album.js'));
  album.onShow();
  eq(album.data.cards.length, 1, '应有一张归档卡片');
  eq(album.data.cards[0].quote, '我们的纪念');
  eq(album.data.cards[0].privacy, '仅情侣可见');
  eq(album.data.cards[0].aContent, '晚安');
  eq(album.data.cards[0].bContent, '好梦');
  eq(album.data.cards[0].aNick, '小明');
  eq(album.data.cards[0].bNick, '小红');
});

// ---------------- M8 提醒同步 ----------------
moduleStart('M8 提醒同步 (pages/task-detail / tasks)');
resetStorage();
test('remindTA 创建 pending 提醒并标记任务', () => {
  bindWithNames('小明', '小红');
  const detail = loadPage(P('pages/task-detail/task-detail.js'));
  detail.onLoad({ id: 't_goodnight' });
  detail.onAInput({ detail: { value: '晚安' } }); detail.completeA(); // A 完成，等待 B
  detail.remindTA();
  const reminders = wx.getStorageSync('cp_reminders');
  ok(Array.isArray(reminders) && reminders.length === 1, '应写入 1 条提醒');
  eq(reminders[0].status, 'pending');
  eq(reminders[0].taskId, 't_goodnight');
  eq(detail.data.reminded, true, '详情页应标记 reminded');
  const tasks = loadPage(P('pages/tasks/tasks.js'));
  tasks.onShow();
  const t = tasks.data.tasks.find(x => x.id === 't_goodnight');
  eq(t.reminded, true, '任务列表应显示等待TA回应');
});
test('模拟 TA 回应后：B 完成、进度更新、提醒转 responded', () => {
  const detail = loadPage(P('pages/task-detail/task-detail.js'));
  detail.onLoad({ id: 't_goodnight' });
  detail.simulateResponse();
  eq(detail.data.task.bDone, true, 'TA 应完成');
  eq(detail.data.task.progress, 100, '双方完成应为 100%');
  eq(detail.data.reminded, false);
  const reminders = wx.getStorageSync('cp_reminders');
  eq(reminders[0].status, 'responded');
});
test('解除绑定后提醒被清空', () => {
  const bind = loadPage(P('pages/bind/bind.js'));
  bind.onCreate();
  const detail = loadPage(P('pages/task-detail/task-detail.js'));
  detail.onLoad({ id: 't_goodnight' });
  detail.remindTA();
  const index = loadPage(P('pages/index/index.js'));
  index.unbind(); // showModal 模拟返回 confirm=true
  eq(wx.getStorageSync('cp_reminders'), '', 'cp_reminders 应被清除');
});

// ---------------- M9 埋点 ----------------
moduleStart('M9 埋点 (utils/store + pages/analytics)');
resetStorage();
test('关键动作写入事件：绑定/完成/奖励/生成卡片/分享', () => {
  bindWithNames('小明', '小红');
  const detail = loadPage(P('pages/task-detail/task-detail.js'));
  detail.onLoad({ id: 't_goodnight' });
  detail.onAInput({ detail: { value: '晚安' } }); detail.completeA();
  detail.onBInput({ detail: { value: '好梦' } }); detail.completeB(); // 100% -> task_complete
  loadPage(P('pages/complete/complete.js')).onLoad({ id: 't_goodnight' }); // reward
  const card = loadPage(P('pages/card/card.js'));
  card.onLoad({ id: 't_goodnight' });
  card.onQuoteInput({ detail: { value: '纪念' } });
  card.finish(); // card_generated
  card.onShareAppMessage(); // share
  const events = wx.getStorageSync('cp_events');
  const types = events.map(e => e.type);
  ok(types.includes('cp_bind'), '应有 cp_bind');
  ok(types.includes('task_complete'), '应有 task_complete');
  ok(types.includes('reward'), '应有 reward');
  ok(types.includes('card_generated'), '应有 card_generated');
  ok(types.includes('share'), '应有 share');
});
test('行为记录页倒序读取，最新在前', () => {
  const a = loadPage(P('pages/analytics/analytics.js'));
  a.onShow();
  ok(a.data.events.length >= 5, '应读取到多条事件');
  eq(a.data.events[0].type, 'share', '倒序第一条应为最近一次 share');
});
test('清空事件后列表为空', () => {
  const a = loadPage(P('pages/analytics/analytics.js'));
  a.clear();
  eq(wx.getStorageSync('cp_events'), '', '事件应被清空');
  eq(a.data.empty, true);
});

// ---------------- 汇总 ----------------
console.log('\n========================================');
console.log('通过 ' + pass + ' 项，失败 ' + fail + ' 项');
if (fail > 0) {
  console.log('失败用例：');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
} else {
  console.log('全部模块测试通过 \u2705');
}
