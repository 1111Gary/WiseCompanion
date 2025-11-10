/**
 * list.js - 活动列表核心逻辑 (前端客户端)
 * 支持 Checkin / Video / Bank / Shopping 四个页面
 * 支持 category 为数组或字符串
 * 支持倒计时，仅显示剩余天数
 */

const CATEGORY_DISPLAY_MAP = {
    'Checkin': '天天有奖',
    'Video': '看视频赚',
    'Bank': '捡钱任务',
    'Shopping': '省钱秘籍'
};

window.allActivitiesCache = [];

async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await fetch(url, { ...options, cache: 'no-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await res.text();
                throw new Error(`非 JSON 格式: ${text}`);
            }
            return await res.json();
        } catch (e) {
            console.warn(`Fetch attempt ${i + 1} failed: ${e.message}`);
            if (i < maxRetries - 1) await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
            else throw e;
        }
    }
}

async function loadActivities() {
    const filePath = '../activities.json';
    const listContainer = document.getElementById('daily-tasks-list');
    if (listContainer) listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">正在加载活动数据...</p>`;
    try {
        const activities = await fetchWithRetry(filePath);
        if (!Array.isArray(activities)) throw new Error('activities.json 必须是数组');
        window.allActivitiesCache = activities;
        console.log(`[Load] 成功加载 ${activities.length} 条活动数据`);
        return activities;
    } catch (e) {
        console.error(`加载 ${filePath} 失败`, e);
        if (listContainer) listContainer.innerHTML = `<p class="text-red-500 text-center">加载活动失败：${e.message}</p>`;
        return [];
    }
}

function getPlatformIcon(platformName) {
    if (!platformName) return 'fa-gift';
    const map = {
        '微信': 'fab fa-weixin',
        '支付宝': 'fab fa-alipay',
        '招商': 'fa-star',
        '建设': 'fa-building-columns',
        '拼多多': 'fa-shopping-bag',
        '快手': 'fa-video',
        '抖音': 'fa-mobile-screen',
        '淘宝': 'fa-store',
        '网上国网': 'fa-bolt',
        '中国银行': 'fa-university'
    };
    for (const key in map) if (platformName.includes(key)) return map[key];
    return 'fa-gift';
}

function renderActivityCard(activity) {
    const deepLinkUrl = activity.deepLink || '#';
    const icon = getPlatformIcon(activity.sourceApp);
    const buttonText = '去参与';
    const buttonClass = 'status-pending';
    let borderColor = 'var(--color-secondary)';
    if (activity.category) {
        const cats = Array.isArray(activity.category) ? activity.category : [activity.category];
        if (cats.includes('Checkin')) borderColor = 'var(--color-primary)';
        else if (cats.includes('Video')) borderColor = 'var(--color-highlight)';
        else if (cats.includes('Bank')) borderColor = 'var(--color-success)';
        else if (cats.includes('Shopping')) borderColor = 'var(--color-secondary)';
    }

    // 倒计时，仅日期
    let countdownHtml = '';
    if (activity.deadline) {
        const today = new Date();
        const dl = new Date(activity.deadline);
        const diffDays = Math.ceil((dl.setHours(0,0,0,0) - today.setHours(0,0,0,0)) / (1000*60*60*24));
        countdownHtml = diffDays > 0
            ? `<div class="countdown-badge">${diffDays} 天后截止</div>`
            : `<div class="countdown-badge expired-badge">已截止</div>`;
    }

    return `
    <div class="task-list-card" data-id="${activity.id}" style="border-left-color:${borderColor}">
        <div class="task-icon" style="background-color:${borderColor}">
            <i class="fa-solid ${icon}"></i>
        </div>
        <div class="task-content">
            <div class="task-title">${activity.name}</div>
            <div class="task-subtitle">奖励：${activity.specialNote || '标准奖励'} | 平台：${activity.sourceApp}</div>
            <div class="text-xs text-gray-500 mt-1">${activity.description}</div>
            ${countdownHtml}
        </div>
        <div class="task-action">
            <a href="${deepLinkUrl}" target="_blank" rel="noopener noreferrer"
               class="action-button ${buttonClass} flex items-center justify-center">
               ${buttonText}
            </a>
        </div>
    </div>
    `;
}

function renderFilteredActivities(targetCategoryEn, listContainer) {
    if (!window.allActivitiesCache || window.allActivitiesCache.length === 0) return;
    const filteredActivities = window.allActivitiesCache.filter(act => {
        if (!act.category) return false;
        const cats = Array.isArray(act.category) ? act.category : [act.category];
        // 保持首字母大写匹配
        return cats.includes(targetCategoryEn);
    });
    if (filteredActivities.length === 0) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">当前分类(${CATEGORY_DISPLAY_MAP[targetCategoryEn]||targetCategoryEn})暂无活动</p>`;
    } else {
        listContainer.innerHTML = filteredActivities.map(renderActivityCard).join('');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('daily-tasks-list');
    const targetCategoryEn = document.body.getAttribute('data-category');
    if (!listContainer || !targetCategoryEn) return;

    const statusWarning = document.getElementById('data-status-warning');
    if (statusWarning) {
        const name = CATEGORY_DISPLAY_MAP[targetCategoryEn] || targetCategoryEn;
        statusWarning.textContent = `⚠️ 正在显示[${name}]分类活动`;
        statusWarning.style.display = 'block';
    }

    await loadActivities();
    renderFilteredActivities(targetCategoryEn, listContainer);
});
