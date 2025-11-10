/**
 * list.js - 通用活动渲染脚本
 * 支持：Checkin / Video / Bank / Shopping 页面
 * 功能：自动分类、银行筛选、倒计时、统一模板
 */

// ---------------------------------------------
// 全局配置
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

// 分类颜色（可调整成你页面主题色）
const CATEGORY_COLOR_MAP = {
    'DailyTask': '#4CAF50',   // 绿色
    'Payment': '#2196F3',     // 蓝色
    'Deposit': '#FFC107',     // 黄色
    'Checkin': '#2196F3',     // 蓝色
    'Video': '#FFC107',       // 黄色
    'Bank': '#4CAF50',        // 绿色
    'Shopping': '#9C27B0'     // 紫色
};

// ---------------------------------------------
// 平台图标映射
// ---------------------------------------------
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
// 数据加载（带重试）
// ---------------------------------------------
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await fetch(url, { ...options, cache: 'no-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data;
        } catch (e) {
            console.warn(`第 ${i + 1} 次请求失败: ${e.message}`);
            if (i < maxRetries - 1) await new Promise(r => setTimeout(r, (i + 1) * 1000));
            else throw e;
        }
    }
}

async function loadActivities() {
    const listContainer = document.getElementById('daily-tasks-list');
    if (listContainer) listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">正在加载活动数据...</p>`;
    try {
        const data = await fetchWithRetry('./activities.json');
        if (!Array.isArray(data)) throw new Error("活动数据格式错误");
        window.allActivitiesCache = data;
        return data;
    } catch (e) {
        console.error("加载 activities.json 失败", e);
        if (listContainer) listContainer.innerHTML = `<p class="text-red-400 p-4">数据加载失败: ${e.message}</p>`;
        return [];
    }
}

// ---------------------------------------------
// 倒计时渲染
// ---------------------------------------------
function renderCountdown(endDate) {
    if (!endDate) {
        return `<span class="countdown-badge longterm-badge">长期有效</span>`;
    }

    const parsedDate = new Date(endDate.replace(/-/g, '/'));
    if (isNaN(parsedDate)) {
        return `<span class="countdown-badge longterm-badge">长期有效</span>`;
    }

    const now = new Date();
    const diffDays = Math.ceil((parsedDate - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `<span class="countdown-badge expired-badge">已结束</span>`;
    return `<span class="countdown-badge">剩余${diffDays}天</span>`;
}

// ---------------------------------------------
// 活动卡片渲染
// ---------------------------------------------
function renderActivityCard(activity, categoryKey) {
    const icon = getPlatformIcon(activity.sourceApp);
    const borderColor = CATEGORY_COLOR_MAP[categoryKey] || '#9E9E9E';
    const countdownHTML = renderCountdown(activity.endDate);

    return `
        <div class="task-list-card" data-id="${activity.id || ''}" style="border-left-color: ${borderColor};">
            ${countdownHTML}
            <div class="task-icon" style="background-color: ${borderColor};">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div class="task-content">
                <div class="task-title">${activity.name || '未命名活动'}</div>
                <div class="task-subtitle">奖励：${activity.specialNote || '标准奖励'} | 平台：${activity.sourceApp || '未知'}</div>
                <div class="text-xs text-gray-500 mt-1">${activity.description || ''}</div>
            </div>
            <div class="task-action">
                <a href="${activity.deepLink || '#'}" target="_blank" rel="noopener noreferrer" 
                   class="action-button flex items-center justify-center">去参与</a>
            </div>
        </div>
    `;
}

// ---------------------------------------------
// Bank 页面：银行筛选 + 分类渲染
// ---------------------------------------------
function renderBankPage() {
    const banks = [...new Set(
        window.allActivitiesCache
            .filter(a => ['Bank', 'Payment', 'Deposit', 'DailyTask'].some(c => a.category.includes(c)))
            .map(a => a.sourceApp)
            .filter(Boolean)
    )];

    const filterContainer = document.getElementById('bank-filter-container');
    if (filterContainer) {
        filterContainer.innerHTML =
            `<button class="filter-button active" data-bank="All"><i class="fas fa-layer-group"></i> 全部活动</button>` +
            banks.map(b => `<button class="filter-button" data-bank="${b}"><i class="fas fa-university"></i> ${b}</button>`).join('');

        filterContainer.querySelectorAll('.filter-button').forEach(btn => {
            btn.addEventListener('click', () => {
                filterContainer.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderBankTasks(btn.dataset.bank);
            });
        });
    }

    renderBankTasks('All');
}

function renderBankTasks(bankName) {
    const routineContainer = document.getElementById('routine-tasks-list');
    const paymentContainer = document.getElementById('payment-tasks-list');
    const depositContainer = document.getElementById('savings-tasks-list');

    if (!routineContainer || !paymentContainer || !depositContainer) return;

    const filtered = window.allActivitiesCache.filter(a => {
        const isBankRelated = ['Payment', 'Deposit', 'DailyTask'].some(cat => a.category.includes(cat));
        if (!isBankRelated) return false;
        if (bankName !== 'All' && a.sourceApp !== bankName) return false;
        return true;
    });

    routineContainer.innerHTML = filtered
        .filter(a => a.category.includes('DailyTask'))
        .map(a => renderActivityCard(a, 'DailyTask')).join('');

    paymentContainer.innerHTML = filtered
        .filter(a => a.category.includes('Payment'))
        .map(a => renderActivityCard(a, 'Payment')).join('');

    depositContainer.innerHTML = filtered
        .filter(a => a.category.includes('Deposit'))
        .map(a => renderActivityCard(a, 'Deposit')).join('');
}

// ---------------------------------------------
// 通用页面渲染
// ---------------------------------------------
function renderGeneralPage(category) {
    const container = document.getElementById('daily-tasks-list');
    if (!container) return;
    const filtered = window.allActivitiesCache.filter(a => a.category.includes(category));
    container.innerHTML = filtered.map(a => renderActivityCard(a, category)).join('');
}

// ---------------------------------------------
// 页面入口
// ---------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    const body = document.body;
    const pageCategory = body.dataset.category;
    if (!pageCategory) return;

    await loadActivities();

    if (pageCategory === 'Bank') {
        renderBankPage();
    } else {
        renderGeneralPage(pageCategory);
    }

    const statusWarning = document.getElementById('data-status-warning');
    if (statusWarning) {
        statusWarning.textContent = `⚙️ 当前显示 [${CATEGORY_DISPLAY_MAP[pageCategory] || pageCategory}] 活动`;
        statusWarning.style.display = 'block';
    }
});
