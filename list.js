/**
 * list.js - 通用活动渲染 (Bank / Checkin / Video / Shopping)
 * - 不改动页面的原有样式与配色
 * - 从 ./activities.json 拉取数据（cache: no-cache）
 * - Bank 页面：自动生成银行筛选（sourceApp）和子分类筛选（DailyTask/Payment/Deposit）
 * - 倒计时使用页面已有的 .countdown-badge/.expired-badge 样式
 */

/* ---------- 配置 ---------- */
const CONTAINERS = {
  DailyTask: 'routine-tasks-list',
  Payment: 'payment-tasks-list',
  Deposit: 'savings-tasks-list',
  General: 'daily-tasks-list', // checkin/video/shopping 通用容器 id（你的页面里已有）
};

const BUTTON_TEXT_BY_PAGE = {
  CheckIn: '去签到',
  Video: '去观看',
  Bank: '去参与',
  Shopping: '去领取'
};

/* ---------- 工具函数 ---------- */
function safeGet(arr, idx, def = '') { return Array.isArray(arr) && arr[idx] !== undefined ? arr[idx] : def; }
function escapeHtml(s){ return String(s || '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function parseDateMaybe(s){
  if(!s) return null;
  const d1 = new Date(s);
  if(!isNaN(d1)) return d1;
  const d2 = new Date(String(s).replace(/-/g,'/'));
  if(!isNaN(d2)) return d2;
  return null;
}

/* ---------- 倒计时相关 ---------- */
/* badge 插入在卡片最前面（so absolute top/right CSS from your stylesheet works） */
function makeCountdownBadge(endDateStr){
  // return an element (span) not HTML string so we can attach dataset
  const span = document.createElement('span');
  span.className = 'countdown-badge';
  span.dataset.endtime = endDateStr || '';
  span.textContent = '计算中...';
  // Do not set styling here; rely on existing CSS. If position needed, CSS already has absolute.
  return span;
}
function updateCountdownElement(span){
  const endStr = span.dataset.endtime;
  if(!endStr){
    span.textContent = '长期有效';
    span.classList.remove('expired-badge');
    return;
  }
  const d = parseDateMaybe(endStr);
  if(!d){
    span.textContent = '长期有效';
    span.classList.remove('expired-badge');
    return;
  }
  const now = new Date();
  const diff = d - now;
  if(diff <= 0){
    span.textContent = '已过期';
    span.classList.add('expired-badge');
    return;
  }
  const days = Math.floor(diff / (1000*60*60*24));
  const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60
