// 本地存储数据层（本机模拟阶段）。
// 之后接微信云开发时，只需把这里的读写换成云数据库/云函数，页面逻辑无需改动。

const CP_KEY = 'cp_info';
const TASKS_KEY = 'cp_tasks';
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

module.exports = {
  getCP,
  setCP,
  getTasks,
  setTasks,
  ensureTasks,
  getTaskById,
  saveTask
};
