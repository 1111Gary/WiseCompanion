/**
 * list.js - 活动列表核心逻辑
 * 支持页面：CheckIn、Video、Bank、Shopping
 * 数据来源：activities.json
 */

const CATEGORY_DISPLAY_MAP = {
    'CheckIn': '天天有奖',
    'Video': '看视频赚',
    'Bank': '捡钱任务',
    'Shopping': '省钱秘籍'
};

window.allActivitiesCache = [];

// ----------------- 数据加载 -----------------
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, { ...options, cache: 'no-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                throw new Error(`非 JSON 响应: ${text}`);
            }
            return response;
        } catch (err) {
            console.warn(`Fetch attempt ${i + 1} failed: ${err.message}`);
            if (i < maxRetries - 1) await new Promise(r => setTimeout(r, Math.pow(2, i)*1000));
            else throw err;
        }
    }
}

async function loadActivities() {
    const listContainer = document.getElementById('daily-tasks-list');
    if (listContainer) listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">正在加载活动数据...</p>`;
    try {
        const response = await fetchWithRetry('./activities.json');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("数据格式错误，应为数组");
        window.allActivitiesCache = data;
        return data;
    } catch (err) {
        console.error(err);
        if (listContainer) listContainer.innerHTML = `<p class="text-red-400 text-center p-4">加载失败: ${err.message}</p>`;
        return [];
    }
}

// ----------------- 辅助函数 -----------------
function getPlatformIcon(name) {
    if (!name) return 'fa-gift';
    if (name.includes('微信')) return 'fab fa-weixin';
    if (name.includes('支付宝')) return 'fab fa-alipay';
    if (name.includes('招商')) return 'fa-star';
    if (name.includes('建设')) return 'fa-building-columns';
    if (name.includes('拼多多')) return 'fa-shopping-bag';
    if (name.includes('快手')) return 'fa-video';
    if (name.includes('抖音')) return 'fa-mobile-screen';
    if (name.includes('淘宝')) return 'fa-store';
    if (name.includes('网上国网')) return 'fa-bolt';
    if (name.includes('中国银行')) return 'fa-university';
    return 'fa-gift';
}

function formatCountdown(deadline) {
    if (!deadline) return '';
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;
    if (diff <= 0) return '已结束';
    const days = Math.ceil(diff / (1000*60*60*24));
    return `剩余 ${days} 天`;
}

// ----------------- 渲染 -----------------
function renderActivityCard(activity) {
    const deepLink = activity.deepLink || '#';
    const icon = getPlatformIcon(activity.sourceApp);

    let borderColor = 'var(--color-secondary)';
    if (activity.category.some(c => c.toLowerCase() === 'checkin')) borderColor = 'var(--color-primary)';
    else if (activity.category.some(c => c.toLowerCase() === 'video')) borderColor = 'var(--color-highlight)';
    else if (activity.category.some(c => c.toLowerCase() === 'bank')) borderColor = 'var(--color-success)';
    else if (activity.category.some(c => c.toLowerCase() === 'shopping')) borderColor = 'var(--color-accent)';

    const countdown = activity.deadline ? `<div class="task-countdown">${formatCountdown(activity.deadline)}</div>` : '';

    return `
    <div class="task-list-card" data-id="${activity.id}" style="border-left-color: ${borderColor};">
        <div class="task-icon" style="background-color: ${borderColor};">
            <i class="fa-solid ${icon}"></i>
        </div>
        <div class="task-content">
            <div class="task-title">${activity.name}</div>
            <div class="task-subtitle">奖励：${activity.specialNote || '标准奖励'} | 平台：${activity.sourceApp}</div>
            <div class="text-xs text-gray-500 mt-1">${activity.description}</div>
            ${countdown}
        </div>
        <div class="task-action">
            <a href="${deepLink}" target="_blank" rel="noopener noreferrer" class="action-button status-pending flex items-center justify-center">
                去参与
            </a>
        </div>
    </div>`;
}

function renderFilteredActivities(targetCategoryEn, listContainer) {
    if (!window.allActivitiesCache.length) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">无数据</p>`;
        return;
    }

    const filtered = window.allActivitiesCache.filter(act => {
        if (!act.category) return false;
        const cats = Array.isArray(act.category) ? act.category : [act.category];
        return cats.some(c => c.trim().toLowerCase() === targetCategoryEn.trim().toLowerCase());
    });

    if (!filtered.length) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">当前分类暂无活动</p>`;
    } else {
        listContainer.innerHTML = filtered.map(renderActivityCard).join('');
    }
}

// ----------------- 主入口 -----------------
document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('daily-tasks-list');
    const targetCategoryEn = document.body.getAttribute('data-category');
    if (!listContainer || !targetCategoryEn) return;

    const statusWarning = document.getElementById('data-status-warning');
    if (statusWarning) {
        const catName = CATEGORY_DISPLAY_MAP[targetCategoryEn] || targetCategoryEn;
        statusWarning.textContent = `⚠️ 正在显示 [${catName}] 分类活动`;
        statusWarning.style.display = 'block';
    }

    await loadActivities();
    renderFilteredActivities(targetCategoryEn, listContainer);
});
