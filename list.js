/**
 * list.js - 活动列表核心逻辑 (前端客户端)
 * 兼容 CheckIn / Video / Bank / Shopping 页面
 * 职责：
 * 1. 从 ./activities.json 加载数据
 * 2. 根据 data-category 和可选 data-subcategory 过滤活动
 * 3. 渲染活动卡片，不改变原页面样式
 */

// --------------------------------------------------------------------------------
// 核心配置
// --------------------------------------------------------------------------------
const CATEGORY_DISPLAY_MAP = {
    'CheckIn': '天天有奖',
    'Video': '看视频赚',
    'Bank': '捡钱任务',
    'Shopping': '省钱秘籍'
};

window.allActivitiesCache = []; // 全局缓存

// --------------------------------------------------------------------------------
// 辅助函数
// --------------------------------------------------------------------------------
async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("返回的不是 JSON 数据");
            }
            return response;
        } catch (err) {
            console.warn(`Fetch attempt ${i + 1} failed: ${err.message}`);
            if (i < maxRetries - 1) await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
            else throw err;
        }
    }
}

async function loadActivities() {
    const filePath = './activities.json';
    const listContainer = document.getElementById('daily-tasks-list');
    if (listContainer) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">正在加载活动数据...</p>`;
    }

    try {
        const response = await fetchWithRetry(filePath, { method: 'GET', cache: 'no-cache' });
        const activities = await response.json();
        if (!Array.isArray(activities)) throw new Error("activities.json 格式不正确，应为数组");
        window.allActivitiesCache = activities;
        return activities;
    } catch (err) {
        console.error(err);
        if (listContainer) {
            listContainer.innerHTML = `<p class="text-red-400 text-center p-4">活动加载失败，请检查 activities.json 文件</p>`;
        }
        return [];
    }
}

// 获取 Font Awesome 图标
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

// 计算倒计时天数
function renderCountdown(expireDate) {
    if (!expireDate) return '';
    const now = new Date();
    const end = new Date(expireDate);
    const diffTime = end - now;
    if (diffTime <= 0) return '已结束';
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `剩余 ${diffDays} 天`;
}

// 渲染单个活动卡片
function renderActivityCard(activity) {
    const deepLinkUrl = activity.deepLink || '#';
    const icon = getPlatformIcon(activity.sourceApp);
    const buttonText = '去参与';
    const buttonClass = 'status-pending';
    let borderColor = 'var(--color-secondary)';
    if (activity.category.includes('CheckIn')) borderColor = 'var(--color-primary)';
    else if (activity.category.includes('Video')) borderColor = 'var(--color-highlight)';
    else if (activity.category.includes('Bank')) borderColor = 'var(--color-success)';

    const countdown = renderCountdown(activity.expireDate);

    return `
    <div class="task-list-card" data-id="${activity.id}" style="border-left-color: ${borderColor};">
        <div class="task-icon" style="background-color: ${borderColor};">
            <i class="fa-solid ${icon}"></i>
        </div>
        <div class="task-content">
            <div class="task-title">${activity.name}</div>
            <div class="task-subtitle">奖励：${activity.specialNote || '标准奖励'} | 平台：${activity.sourceApp}</div>
            <div class="text-xs text-gray-500 mt-1">${activity.description}</div>
            ${countdown ? `<div class="text-xs text-red-500 mt-1">${countdown}</div>` : ''}
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

// 渲染列表
function renderFilteredActivities(targetCategory, targetSubcategory, listContainer) {
    if (!window.allActivitiesCache || window.allActivitiesCache.length === 0) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">暂无活动</p>`;
        return;
    }

    const filtered = window.allActivitiesCache.filter(act => {
        if (!act.category || !Array.isArray(act.category)) return false;
        if (targetSubcategory) {
            return act.category.includes(targetCategory) && act.category.includes(targetSubcategory);
        }
        return act.category.includes(targetCategory);
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">当前分类暂无活动</p>`;
        return;
    }

    listContainer.innerHTML = filtered.map(renderActivityCard).join('');
}

// --------------------------------------------------------------------------------
// 主入口
// --------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('daily-tasks-list');
    const targetCategory = document.body.getAttribute('data-category');
    const targetSubcategory = document.body.getAttribute('data-subcategory');

    if (!listContainer || !targetCategory) {
        console.error("页面缺少必要容器或 data-category 属性");
        return;
    }

    const statusWarning = document.getElementById('data-status-warning');
    if (statusWarning) {
        const categoryName = CATEGORY_DISPLAY_MAP[targetCategory] || targetCategory;
        statusWarning.textContent = `⚠️ 提示：正在显示[${categoryName}]分类的最新活动。`;
        statusWarning.style.display = 'block';
    }

    await loadActivities();
    renderFilteredActivities(targetCategory, targetSubcategory, listContainer);
});
