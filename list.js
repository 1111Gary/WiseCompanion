/**
 * list.js - 活动列表核心逻辑 (前端客户端)
 * 支持页面：CheckIn / Video / Bank / Shopping
 * 1. 从 ./activities.json 加载数据。
 * 2. 根据 body 的 data-category 和可选 data-subcategory 过滤活动。
 * 3. 渲染活动卡片，并显示倒计时（只到日期）。
 */

// ------------------------------
// 核心映射配置
// ------------------------------
const CATEGORY_DISPLAY_MAP = {
    'CheckIn': '天天有奖',
    'Video': '看视频赚',
    'Bank': '捡钱任务',
    'Shopping': '省钱秘籍',
    'DailyTask': '日常活动',
    'Payment': '缴费活动',
    'Deposit': '存款理财活动'
};

// 全局缓存
window.allActivitiesCache = [];

// ------------------------------
// 数据加载
// ------------------------------
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await fetch(url, { ...options, cache: 'no-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                throw new Error(`不是 JSON: ${text}`);
            }
            return await res.json();
        } catch (err) {
            console.warn(`Fetch ${i + 1} 失败: ${err.message}`);
            if (i < maxRetries - 1) await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
            else throw err;
        }
    }
}

async function loadActivities() {
    const listContainer = document.getElementById('daily-tasks-list');
    if (listContainer) listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">正在加载活动数据...</p>`;
    try {
        const activities = await fetchWithRetry('./activities.json');
        if (!Array.isArray(activities)) throw new Error('JSON 数据不是数组');
        window.allActivitiesCache = activities;
        return activities;
    } catch (err) {
        console.error('加载 activities.json 失败', err);
        if (listContainer) {
            listContainer.innerHTML = `<p class="text-red-400 text-center p-4">数据加载失败：${err.message}</p>`;
        }
        return [];
    }
}

// ------------------------------
// 渲染逻辑
// ------------------------------
function getPlatformIcon(appName) {
    if (!appName) return 'fa-gift';
    if (appName.includes('微信')) return 'fab fa-weixin';
    if (appName.includes('支付宝')) return 'fab fa-alipay';
    if (appName.includes('招商')) return 'fa-star';
    if (appName.includes('建设')) return 'fa-building-columns';
    if (appName.includes('拼多多')) return 'fa-shopping-bag';
    if (appName.includes('快手')) return 'fa-video';
    if (appName.includes('抖音')) return 'fa-mobile-screen';
    if (appName.includes('淘宝')) return 'fa-store';
    if (appName.includes('网上国网')) return 'fa-bolt';
    if (appName.includes('中国银行')) return 'fa-university';
    return 'fa-gift';
}

function renderActivityCard(activity) {
    const icon = getPlatformIcon(activity.sourceApp);
    const buttonText = '去参与';
    const buttonClass = 'status-pending';
    let borderColor = 'var(--color-secondary)';
    if (activity.category.includes('CheckIn')) borderColor = 'var(--color-primary)';
    else if (activity.category.includes('Video')) borderColor = 'var(--color-highlight)';
    else if (activity.category.includes('Bank')) borderColor = 'var(--color-success)';
    // 倒计时
    let countdownHtml = '';
    if (activity.endDate) {
        const now = new Date();
        const end = new Date(activity.endDate + 'T23:59:59'); // 只到日期
        const diff = end - now;
        if (diff > 0) {
            const days = Math.ceil(diff / (1000*60*60*24));
            countdownHtml = `<div class="text-xs text-red-500 mt-1">剩余 ${days} 天</div>`;
        } else {
            countdownHtml = `<div class="text-xs text-gray-400 mt-1">已结束</div>`;
        }
    }

    return `
        <div class="task-list-card" data-id="${activity.id}" style="border-left-color: ${borderColor};">
            <div class="task-icon" style="background-color: ${borderColor};">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div class="task-content">
                <div class="task-title">${activity.name}</div>
                <div class="task-subtitle">奖励：${activity.specialNote || '标准奖励'} | 平台：${activity.sourceApp}</div>
                <div class="text-xs text-gray-500 mt-1">${activity.description}</div>
                ${countdownHtml}
            </div>
            <div class="task-action">
                <a href="${activity.deepLink || '#'}" target="_blank" rel="noopener noreferrer" 
                   class="action-button ${buttonClass} flex items-center justify-center">${buttonText}</a>
            </div>
        </div>
    `;
}

function renderFilteredActivities(category, subcategory) {
    const listContainer = document.getElementById('daily-tasks-list');
    if (!listContainer) return;

    const filtered = window.allActivitiesCache.filter(act => {
        if (!act.category || !Array.isArray(act.category)) return false;
        if (subcategory) return act.category.includes(category) && act.category.includes(subcategory);
        return act.category.includes(category);
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">当前分类暂无活动。</p>`;
        return;
    }

    listContainer.innerHTML = filtered.map(renderActivityCard).join('');
}

// ------------------------------
// 主入口
// ------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('daily-tasks-list');
    const category = document.body.getAttribute('data-category');       // 页面主分类
    const subcategory = document.body.getAttribute('data-subcategory'); // 可选子分类

    // 显示提示
    const statusWarning = document.getElementById('data-status-warning');
    if (statusWarning && category) {
        const catName = CATEGORY_DISPLAY_MAP[category] || category;
        const subName = subcategory ? (CATEGORY_DISPLAY_MAP[subcategory] || subcategory) : '';
        statusWarning.textContent = `⚠️ 提示：正在显示 [${catName}${subName ? ' > '+subName : ''}] 分类的活动`;
        statusWarning.style.display = 'block';
    }

    await loadActivities();
    renderFilteredActivities(category, subcategory);
});
