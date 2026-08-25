// 业务常量：任务模板、隐私选项。后续接云开发时，任务模板可改为后台下发。

const TASK_TEMPLATES = [
  {
    id: 't_goodnight',
    name: '今日晚安打卡',
    desc: '各自写下一句晚安，互道一声好梦。简单的陪伴，也能积攒亲密度。',
    type: 'parallel',
    modeText: '并行模式：双方各自完成自己的动作',
    reward: { intimacy: 10, growth: 5 }
  }
];

const PRIVACY_OPTIONS = ['公开', '好友可见', '仅情侣可见', '匿名分享'];

module.exports = { TASK_TEMPLATES, PRIVACY_OPTIONS };
