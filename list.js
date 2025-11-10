/**
 * list.js - 全局活动渲染
 * 支持 Checkin / Video / Bank / Shopping 页面
 * 自动分类、倒计时、银行筛选器
 */

// ---------------------------------------------
// 配置
// ---------------------------------------------

const CATEGORY_DISPLAY_MAP = {
    'Checkin': '天天有奖',
    'Video': '看视频赚',
    'Bank': '捡钱任务',
    'Shopping': '省钱秘籍',
    'DailyTask': '日常活动',
    'Payment': '缴费活动',
    'Deposit': '存款理财活动'
};

window.allActivitiesCache = [];

// 分类颜色
const CATEGORY_COLOR_MAP = {
    'DailyTask': 'var(--color-success)',
    'Payment': 'var(--color-primary)',
    'Deposit': 'var(--color-highlight)',
    'Checkin': 'var(--color-primary)',
    'Video': 'var(--color-highlight)',
    'Bank': 'var(--color-success)',
    'Shopping': 'var(--color-secondary)'
};

// 图标映射
function getPlatformIcon(platformName) {
    if (!platformName) return 'fa-gift';
    if (platformName.includes('微信')) return 'fab fa-weixin';
    if (platformName.includes('支付宝')) return 'fab fa-alipay';
    if (platformName.includes('招商')) return 'fa-star';
    if (platformName.includes('建设')) return 'fa-building-columns';
    if (platformName.includes('拼多多')) return 'fa-shopping-bag';
    if (platformName.includes('快手')) return 'fa-video';
    if (platformName.includes('抖音')) return 'fa-mobile-screen';
    if (platformName.includes('淘宝')) return 'fa-store';
    if (platformName.includes('国网')) return 'fa-bolt';
    if (platformName.includes('中国银行')) return 'fa-university';
    return 'fa-gift';
}

// ---------------------------------------------
// 数据加载
// ---------------------------------------------
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await fetch(url, {...options, cache:'no-cache'});
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                throw new Error(`非 JSON 数据: ${text}`);
            }
            return res;
        } catch(e) {
            console.warn(`Fetch attempt ${i+1} failed: ${e.message}`);
            if(i < maxRetries -1) await new Promise(r=>setTimeout(r, Math.pow(2,i)*1000));
            else throw e;
        }
    }
}

async function loadActivities() {
    const listContainer = document.getElementById('daily-tasks-list');
    if(listContainer) listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">正在加载活动数据...</p>`;
    try {
        const res = await fetchWithRetry('./activities.json');
        const data = await res.json();
        if(!Array.isArray(data)) throw new Error("活动数据格式错误");
        window.allActivitiesCache = data;
        return data;
    } catch(e) {
        console.error("加载 activities.json 失败", e);
        if(listContainer) listContainer.innerHTML = `<p class="text-red-400 p-4">数据加载失败: ${e.message}</p>`;
        return [];
    }
}

// ---------------------------------------------
// 渲染
// ---------------------------------------------
function renderCountdown(endDate) {
    if(!endDate) return '';
    const now = new Date();
    const end = new Date(endDate);
    const diffDays = Math.ceil((end - now) / (1000*60*60*24));
    if(diffDays < 0) return `<span class="countdown-badge expired-badge">已结束</span>`;
    return `<span class="countdown-badge">剩余${diffDays}天</span>`;
}

function getCountdownBadge(endDate) {
  if (!endDate) return ''; // 无截止日期 → 不显示倒计时
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `<div class="countdown-badge expired-badge">已结束</div>`;
  } else if (diffDays === 0) {
    return `<div class="countdown-badge">最后一天</div>`;
  } else {
    return `<div class="countdown-badge">剩余${diffDays}天</div>`;
  }
}


function renderActivityCard(activity, categoryKey) {
    const icon = getPlatformIcon(activity.sourceApp);
    const borderColor = CATEGORY_COLOR_MAP[categoryKey] || 'var(--color-secondary)';
    const countdownHTML = renderCountdown(activity.endDate);

    return `
        <div class="task-list-card" data-id="${activity.id}" style="border-left-color: ${borderColor};">
            ${countdownHTML}
            <div class="task-icon" style="background-color: ${borderColor};">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div class="task-content">
                <div class="task-title">${activity.name}</div>
                <div class="task-subtitle">奖励：${activity.specialNote || '标准奖励'} | 平台：${activity.sourceApp}</div>
                <div class="text-xs text-gray-500 mt-1">${activity.description}</div>
            </div>
            <div class="task-action">
                <a href="${activity.deepLink||'#'}" target="_blank" rel="noopener noreferrer" 
                   class="action-button flex items-center justify-center">去参与</a>
            </div>
        </div>
    `;
}

// ---------------------------------------------
// Bank 页面：按银行筛选
// ---------------------------------------------
function renderBankPage() {
    const banks = [...new Set(window.allActivitiesCache
        .filter(a=>a.category.includes('Bank'))
        .map(a=>a.sourceApp)
    )];

    const filterContainer = document.getElementById('bank-filter-container');
    if(filterContainer){
        filterContainer.innerHTML = `<button class="filter-button active" data-bank="All"><i class="fas fa-layer-group"></i> 全部活动</button>` +
            banks.map(b => `<button class="filter-button" data-bank="${b}"><i class="fas fa-university"></i> ${b}</button>`).join('');
        filterContainer.querySelectorAll('.filter-button').forEach(btn=>{
            btn.addEventListener('click', ()=>{
                filterContainer.querySelectorAll('.filter-button').forEach(b=>b.classList.remove('active'));
                btn.classList.add('active');
                renderBankTasks(btn.dataset.bank);
            });
        });
    }

    renderBankTasks('All');
}

taskList.innerHTML += `
  <div class="task-list-card" style="border-left-color:${borderColor}">
    ${getCountdownBadge(activity.endDate || '')}
    <div class="task-icon" style="background-color:${borderColor}">${activity.icon || '🏦'}</div>
    <div class="task-content">
      <div class="task-title">${activity.name}</div>
      <div class="task-subtitle">${activity.description}</div>
    </div>
    <div class="task-action">
      <a href="${activity.deepLink || '#'}" target="_blank" class="action-button">去参与</a>
    </div>
  </div>
`;


function renderBankTasks(bankName) {
    const routineContainer = document.getElementById('routine-tasks-list');
    const paymentContainer = document.getElementById('payment-tasks-list');
    const depositContainer = document.getElementById('savings-tasks-list');

    if(!routineContainer || !paymentContainer || !depositContainer) return;

    const filtered = window.allActivitiesCache.filter(a=>{
        if(!a.category.includes('Bank')) return false;
        if(bankName!=='All' && a.sourceApp!==bankName) return false;
        return true;
    });

    routineContainer.innerHTML = filtered
        .filter(a=>a.category.includes('DailyTask'))
        .map(a=>renderActivityCard(a,'DailyTask')).join('');
    paymentContainer.innerHTML = filtered
        .filter(a=>a.category.includes('Payment'))
        .map(a=>renderActivityCard(a,'Payment')).join('');
    depositContainer.innerHTML = filtered
        .filter(a=>a.category.includes('Deposit'))
        .map(a=>renderActivityCard(a,'Deposit')).join('');
}

// ---------------------------------------------
// 通用页面渲染
// ---------------------------------------------
function renderGeneralPage(category) {
    const container = document.getElementById('daily-tasks-list');
    if(!container) return;
    const filtered = window.allActivitiesCache.filter(a=>a.category.includes(category));
    container.innerHTML = filtered.map(a=>renderActivityCard(a,category)).join('');
}

// ---------------------------------------------
// 页面入口
// ---------------------------------------------
document.addEventListener('DOMContentLoaded', async ()=>{
    const body = document.body;
    const pageCategory = body.dataset.category;
    if(!pageCategory) return;

    await loadActivities();

    if(pageCategory==='Bank'){
        renderBankPage();
    }else{
        renderGeneralPage(pageCategory);
    }

    const statusWarning = document.getElementById('data-status-warning');
    if(statusWarning){
        statusWarning.textContent = `⚠️ 当前显示为 [${CATEGORY_DISPLAY_MAP[pageCategory]||pageCategory}] 分类活动`;
        statusWarning.style.display='block';
    }
});
