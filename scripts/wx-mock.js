// 微信小程序运行环境模拟（仅用于本地 Node 测试，不进入小程序包）。
// 提供 wx / getApp / Page / App 的极简实现，让页面 .js 能在 Node 里被加载并调用方法。
// 用法见 test-modules.js：
//   const { wx, loadPage, resetStorage, getApp } = require('./wx-mock');

let storage = {};

const wx = {
  getStorageSync: (k) => (Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : ''),
  setStorageSync: (k, v) => { storage[k] = v; },
  removeStorageSync: (k) => { delete storage[k]; },
  showToast: () => {},
  showModal: (opt) => { if (opt && typeof opt.success === 'function') opt.success({ confirm: true }); },
  navigateTo: () => {},
  redirectTo: () => {},
  navigateBack: () => {},
  setNavigationBarTitle: () => {},
  showShareMenu: () => {},
  requestSubscribeMessage: (opt) => { if (opt && typeof opt.success === 'function') opt.success({}); },
  // 测试可覆盖的钩子
  _calls: []
};

// 记录关键调用，便于断言（如导航 target）
function track(type, payload) { wx._calls.push({ type, payload }); }

const appInstance = { globalData: {} };
const getApp = () => appInstance;

let _pageCfg = null;
function Page(cfg) { _pageCfg = cfg; }
function App() { /* 小程序入口，测试无需 */ }

// 页面 .js 以全局方式调用 wx / getApp / Page / App，必须挂到 global
global.wx = wx;
global.getApp = getApp;
global.Page = Page;
global.App = App;

// 加载一个页面 .js，返回绑定好 this 的上下文（含 data / setData / 各方法）
function loadPage(absPath) {
  _pageCfg = null;
  delete require.cache[require.resolve(absPath)];
  require(absPath);
  if (!_pageCfg) throw new Error('页面未调用 Page()：' + absPath);
  const cfg = _pageCfg;
  const ctx = {};
  ctx.data = JSON.parse(JSON.stringify(cfg.data || {}));
  ctx.setData = function (patch) {
    Object.assign(this.data, patch);
    track('setData', patch);
  };
  for (const k of Object.keys(cfg)) {
    if (k === 'data') continue;
    if (typeof cfg[k] === 'function') ctx[k] = cfg[k].bind(ctx);
  }
  return ctx;
}

function resetStorage() {
  storage = {};
  wx._calls = [];
}

module.exports = { wx, loadPage, resetStorage, getApp, Page, App };
