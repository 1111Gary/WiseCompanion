/**
 * list.js - 通用活动渲染脚本（稳健版）
 * 支持 Checkin / Video / Bank / Shopping 页面
 * 修复了倒计时定位、长期活动显示以及按钮颜色回退问题
 */

// ---------------------------------------------
// 全局配置（如需调整颜色，可在这里改）
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

// 分类颜色回退值（使用 CSS 变量也可以）
const CATEGORY_COLOR_MAP = {
    'DailyTask': 'var(--color-success, #4CAF50)',
    'Payment': 'var(--color-primary, #2196F3)',
    'Deposit': 'var(--color-highlight, #FFC107)',
    'Checkin': 'var(--color-primary, #2196F3)',
    'Video': 'var(--color-highlight, #FFC107)',
    'Bank': 'var(--color-success, #4CAF50)',
    'Shopping': 'var(--color-secondary, #FF69B4)'
};

// ---------------------------------------------
// 图标映射（保持不变）
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
// load activities (带重试、容错)
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
            if (i < maxRetries - 1) await new Promise(r => setTimeout(r, (i + 1) * 500));
            else throw e;
        }
    }
}

async function loadActivities() {
    const listContainer = document.getElementById('daily-tasks-list');
    if (listContainer) listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">正在加载活动数据...</p>`;
    try {
        const data = await fetchWithRetry('./activities.json');
        if (!Array.isArray(data)) throw new Error('activities.json 需为数组');
        window.allActivitiesCache = data;
        return data;
    } catch (err) {
        console.error('加载 activities.json 失败', err);
        if (listContainer) listContainer.innerHTML = `<p class="text-red-400 p-4">数据加载失败: ${err.message}</p>`;
        window.allActivitiesCache = [];
        return [];
    }
}

// ---------------------------------------------
// 倒计时渲染（稳健，放在卡片右上绝对定位，避免影响流内布局）
// - 如果没有 endDate 显示 “长期有效” （可改为不显示）
// - 支持多种日期格式解析（尝试直接解析->替换 '-' -> 最后返回长期有效）
// ---------------------------------------------
function safeParseDate(dateStr) {
    if (!dateStr) return null;
    // 去掉空白
    const s = String(dateStr).trim();
    if (!s) return null;
    // 尝试直接解析
    let d = new Date(s);
    if (!isNaN(d)) return d;
    // 尝试替换 '-' -> '/'（提高兼容性）
    d = new Date(s.replace(/-/g, '/'));
    if (!isNaN(d)) return d;
    // 如果仍然无效，返回 null（视为长期）
    return null;
}

function renderCountdownBadge(endDateStr) {
    // 这里我们强制返回一个带 inline style 的绝对定位 badge，
    // 避免页面其他 CSS 干扰把它当作普通 inline 元素
    const badgeStyle = 'position:absolute;top:6px;right:6px;z-index:6;';
    if (!endDateStr) {
        // 长期有效：显示为浅粉（使用现有 CSS class 以便继承风格），并追加 inline 定位
        return `<span class="countdown-badge longterm-badge" style="${badgeStyle}">长期有效</span>`;
    }
    const d = safeParseDate(endDateStr);
    if (!d) {
        return `<span class="countdown-badge longterm-badge" style="${badgeStyle}">长期有效</span>`;
    }
    const now = new Date();
    const diffMs = d - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
        return `<span class="countdown-badge expired-badge" style="${badgeStyle}">已结束</span>`;
    } else if (diffDays === 0) {
        return `<span class="countdown-badge" style="${badgeStyle}">最后一天</span>`;
    } else {
        return `<span class="countdown-badge" style="${badgeStyle}">剩余 ${diffDays} 天</span>`;
    }
}

// ---------------------------------------------
// 卡片渲染（尽量和原 structure 保持一致）
// 解释：把 badge 插入到 task-list-card 内顶部（绝对定位），
// 并为 action-button 提供 inline 回退样式以防被全局覆盖
// ---------------------------------------------
function renderActivityCard(activity, categoryKey) {
    // 保护字段，避免 undefined
    const id = activity.id || '';
    const name = activity.name || '未命名活动';
    const desc = activity.description || '';
    const sourceApp = activity.sourceApp || '';
    const deepLink = activity.deepLink || '#';
    // icon 字段：优先使用字体图标映射，否则使用 activity.icon 原始字符
    const platformIcon = getPlatformIcon(sourceApp);
    const rawIcon = activity.icon && !activity.icon.startsWith('fa') ? activity.icon : null; // emoji or char
    const showIconHtml = rawIcon ? rawIcon : `<i class="fa-solid ${platformIcon}"></i>`;

    const borderColor = CATEGORY_COLOR_MAP[categoryKey] || '#9E9E9E';
    const countdownHtml = renderCountdownBadge(activity.endDate);

    // 为保证按钮颜色不被外部覆盖，提供 inline fallback（不会覆盖你 CSS 的主题）
    const btnBg = 'background-color: var(--color-primary, #00BFFF); color: var(--color-bg-dark, #0A1322);';
    return `
        <div class="task-list-card" data-id="${id}" style="border-left-color: ${borderColor}; position: relative;">
            ${countdownHtml}
            <div class="task-icon" style="background-color: ${borderColor};">
                ${showIconHtml}
            </div>
            <div class="task-content">
                <div class="task-title">${name}</div>
                <div class="task-subtitle">奖励：${activity.specialNote || '标准奖励'} | 平台：${sourceApp}</div>
                <div class="text-xs text-gray-500 mt-1">${desc}</div>
            </div>
            <div class="task-action">
                <a href="${deepLink}" target="_blank" rel="noopener noreferrer"
                   class="action-button" style="${btnBg}">${activity.buttonText || '去参与'}</a>
            </div>
        </div>
    `;
}

// ---------------------------------------------
// Bank 页面特殊渲染（银行筛选 + 三类子分类）
// - Bank 活动可能只有 Payment/Deposit/DailyTask 中的一项或多项
// - 我们把“是否与银行相关”定义为包含 DailyTask/Payment/Deposit 中任意一项
// ---------------------------------------------
function renderBankPage() {
    // 1) 提取银行列表（去重、过滤空值）
    const banks = [...new Set(
        window.allActivitiesCache
            .filter(a => Array.isArray(a.category) && ['DailyTask', 'Payment', 'Deposit'].some(c => a.category.includes(c)))
            .map(a => (a.sourceApp || '').trim())
            .filter(Boolean)
    )];

    const filterContainer = document.getElementById('bank-filter-container');
    if (filterContainer) {
        // 保留已有“全部活动”按钮样式并生成银行按钮
        filterContainer.innerHTML =
            `<button class="filter-button active" data-bank="All"><i class="fas fa-layer-group"></i> 全部活动</button>` +
            banks.map(b => `<button class="filter-button" data-bank="${escapeHtmlAttr(b)}"><i class="fas fa-university"></i> ${escapeHtml(b)}</button>`).join('');
        // 绑定事件
        filterContainer.querySelectorAll('.filter-button').forEach(btn => {
            btn.addEventListener('click', () => {
                filterContainer.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderBankTasks(btn.dataset.bank);
            });
        });
    }

    // 首次渲染全部
    renderBankTasks('All');
}

function renderBankTasks(bankName) {
    const routineContainer = document.getElementById('routine-tasks-list');
    const paymentContainer = document.getElementById('payment-tasks-list');
    const depositContainer = document.getElementById('savings-tasks-list');
    if (!routineContainer || !paymentContainer || !depositContainer) return;

    // 只要是三类中的任意一种，都视为银行相关活动
    const allBankRelated = window.allActivitiesCache.filter(a => {
        if (!Array.isArray(a.category)) return false;
        const isBankRelated = ['DailyTask', 'Payment', 'Deposit'].some(c => a.category.includes(c));
        if (!isBankRelated) return false;
        if (bankName && bankName !== 'All' && String(a.sourceApp || '') !== String(bankName)) return false;
        return true;
    });

    // 按子类渲染（保持原顺序）
    const dailyArr = allBankRelated.filter(a => Array.isArray(a.category) && a.category.includes('DailyTask'));
    const paymentArr = allBankRelated.filter(a => Array.isArray(a.category) && a.category.includes('Payment'));
    const depositArr = allBankRelated.filter(a => Array.isArray(a.category) && a.category.includes('Deposit'));

    routineContainer.innerHTML = dailyArr.length ? dailyArr.map(a => renderActivityCard(a, 'DailyTask')).join('') : `<p class="text-gray-400 text-center p-4">暂无活动</p>`;
    paymentContainer.innerHTML = paymentArr.length ? paymentArr.map(a => renderActivityCard(a, 'Payment')).join('') : `<p class="text-gray-400 text-center p-4">暂无活动</p>`;
    depositContainer.innerHTML = depositArr.length ? depositArr.map(a => renderActivityCard(a, 'Deposit')).join('') : `<p class="text-gray-400 text-center p-4">暂无活动</p>`;
}

// ---------------------------------------------
// 通用页面渲染（Checkin / Video / Shopping）
// ---------------------------------------------
function renderGeneralPage(categoryKey) {
    const container = document.getElementById('daily-tasks-list');
    if (!container) return;
    const arr = window.allActivitiesCache.filter(a => Array.isArray(a.category) && a.category.includes(categoryKey));
    container.innerHTML = arr.length ? arr.map(a => renderActivityCard(a, categoryKey)).join('') : `<p class="text-gray-400 text-center p-4">暂无活动</p>`;
}

// ---------------------------------------------
// 实用：防 XSS 的简单转义（渲染 bank 名称时用）
// ---------------------------------------------
function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s]);
}
function escapeHtmlAttr(str) { return escapeHtml(str); }

// ---------------------------------------------
// 页面入口
// ---------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    const pageCategory = (document.body && document.body.dataset && document.body.dataset.category) || '';
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
