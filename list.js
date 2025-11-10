/**
 * list.js - 活动列表核心逻辑 (前端客户端)
 * 功能：
 * 1. 从 ./activities.json 加载数据。
 * 2. 根据页面 data-category 过滤活动。
 * 3. 渲染活动卡片。
 * 4. 支持倒计时显示（Bank 页面）。
 */

// --------------------- 配置 ---------------------
const CATEGORY_DISPLAY_MAP = {
    'Checkin': '天天有奖',
    'Video': '看视频赚',
    'Bank': '捡钱任务',
    'Shopping': '省钱秘籍'
};

// 全局缓存
window.allActivitiesCache = [];

// --------------------- 辅助函数 ---------------------

// 获取平台图标
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
    if (platformName.includes('网上国网')) return 'fa-bolt';
    if (platformName.includes('中国银行')) return 'fa-university';
    return 'fa-gift';
}

// 倒计时计算（只到天）
function calcCountdown(deadline) {
    if (!deadline) return '';
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;
    if (diff <= 0) return '已截止';
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `剩余 ${days} 天`;
}

// 渲染单个卡片
function renderActivityCard(activity) {
    const deepLinkUrl = activity.deepLink || '#';
    const icon = getPlatformIcon(activity.sourceApp);
    const buttonText = '去参与';
    const buttonClass = 'status-pending';

    // 左边框颜色
    let borderColor = 'var(--color-secondary)';
    if (activity.category && activity.category.includes('Checkin')) borderColor = 'var(--color-primary)';
    if (activity.category && activity.category.includes('Video')) borderColor = 'var(--color-highlight)';
    if (activity.category && activity.category.includes('Bank')) borderColor = 'var(--color-success)';
    if (activity.category && activity.category.includes('Shopping')) borderColor = 'var(--color-warning)';

    // 倒计时显示（仅 Bank 页面）
    let countdownHtml = '';
    if (activity.category && activity.category.includes('Bank') && activity.deadline) {
        countdownHtml = `<div class="countdown text-xs text-red-500 mt-1">${calcCountdown(activity.deadline)}</div>`;
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
                <a href="${deepLinkUrl}" target="_blank" rel="noopener noreferrer" 
                   class="action-button ${buttonClass} flex items-center justify-center">
                    ${buttonText}
                </a>
            </div>
        </div>
    `;
}

// --------------------- 数据加载 ---------------------
async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        } catch (err) {
            console.warn(`Fetch attempt ${i + 1} failed: ${err.message}`);
            if (i < maxRetries - 1) await new Promise(r => setTimeout(r, Math.pow(2, i) * 500));
            else throw err;
        }
    }
}

async function loadActivities() {
    const filePath = './activities.json';
    try {
        const activities = await fetchWithRetry(filePath, { cache: 'no-cache' });
        if (!Array.isArray(activities)) throw new Error('活动数据格式错误');
        window.allActivitiesCache = activities;
        console.log(`[Load] 成功加载 ${activities.length} 条活动`);
        return activities;
    } catch (err) {
        console.error('加载活动失败', err);
        return [];
    }
}

// --------------------- 渲染过滤 ---------------------
function renderFilteredActivities(targetCategoryEn, listContainer) {
    if (!window.allActivitiesCache.length) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">暂无数据</p>`;
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

// --------------------- 主入口 ---------------------
document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('daily-tasks-list');
    const targetCategoryEn = document.body.getAttribute('data-category');

    if (!listContainer || !targetCategoryEn) return;

    // 状态提示
    const statusWarning = document.getElementById('data-status-warning');
    if (statusWarning) {
        const catName = CATEGORY_DISPLAY_MAP[targetCategoryEn] || targetCategoryEn;
        statusWarning.textContent = `⚠️ 正在显示 [${catName}] 分类活动`;
        statusWarning.style.display = 'block';
    }

    await loadActivities();
    renderFilteredActivities(targetCategoryEn, listContainer);
});
