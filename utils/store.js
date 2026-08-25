// 本地存储数据层（本机模拟阶段）。
// 之后接微信云开发时，只需把这里的读写换成云数据库/云函数，页面逻辑无需改动。

const CP_KEY = 'cp_info';
const TASKS_KEY = 'cp_tasks';
const REMINDERS_KEY = 'cp_reminders';
const { TASK_TEMPLATES } = require('./constants');

function getCP() {
  return wx.getStorageSync(CP_KEY) || null;
}

function setCP(cp) {
  wx.setStorageSync(CP_KEY, cp);
}

function getTasks() {
  return wx.getStorageSync(TASKS_KEY) || null;
}

function setTasks(tasks) {
  wx.setStorageSync(TASKS_KEY, tasks);
}

// 首次进入时，按模板初始化本机任务列表；已存在则直接返回
function ensureTasks() {
  let tasks = getTasks();
  if (!tasks || !tasks.length) {
    tasks = TASK_TEMPLATES.map(t => ({
      id: t.id,
      name: t.name,
      desc: t.desc,
      type: t.type,
      modeText: t.modeText,
      reward: t.reward,
      status: 'todo',
      progress: 0,
      aDone: false,
      bDone: false,
      aContent: '',
      bContent: '',
      rewardGiven: false,
      cardGenerated: false,
      archived: false
    }));
    setTasks(tasks);
  }
  return tasks;
}

function getTaskById(id) {
  const tasks = ensureTasks();
  return tasks.find(t => t.id === id);
}

function saveTask(task) {
  const tasks = ensureTasks();
  const idx = tasks.findIndex(t => t.id === task.id);
  if (idx >= 0) tasks[idx] = task;
  setTasks(tasks);
}

// ---------------- 提醒同步（PR-05，本机模拟） ----------------
// reminder: { taskId, remindedAt, status: 'pending' | 'responded' }
function getReminders() {
  return wx.getStorageSync(REMINDERS_KEY) || [];
}

function getReminderByTask(taskId) {
  return getReminders().find(r => r.taskId === taskId) || null;
}

function addReminder(taskId) {
  const list = getReminders();
  const existing = list.find(r => r.taskId === taskId);
  if (existing) {
    existing.remindedAt = new Date().toISOString();
    existing.status = 'pending';
  } else {
    list.push({ taskId, remindedAt: new Date().toISOString(), status: 'pending' });
  }
  wx.setStorageSync(REMINDERS_KEY, list);
  return getReminderByTask(taskId);
}

function respondReminder(taskId) {
  const list = getReminders();
  const r = list.find(x => x.taskId === taskId);
  if (r) {
    r.status = 'responded';
    wx.setStorageSync(REMINDERS_KEY, list);
  }
  return r;
}

function clearReminders() {
  wx.removeStorageSync(REMINDERS_KEY);
}

module.exports = {
  getCP,
  setCP,
  getTasks,
  setTasks,
  ensureTasks,
  getTaskById,
  saveTask,
  getReminders,
  getReminderByTask,
  addReminder,
  respondReminder,
  clearReminders
};
