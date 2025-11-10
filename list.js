/**
 * list.js - 活动列表核心逻辑 (前端客户端)
 * 职责：
 * 1. 从 ../activities.json (根目录) 加载数据。
 * 2. 根据当前 HTML 页面的 data-category 属性，过滤活动。
 * 3. 渲染活动卡片，样式与 HTML 模板一致。
 * 4. 支持倒计时，仅显示剩余天数。
 */

// --------------------------------------------------------------------------------
// 核心配置与映射 (前端)
// --------------------------------------------------------------------------------
const CATEGORY_DISPLAY_MAP = {
    'CheckIn': '天天有奖',
    'Bank': '捡钱任务',
    'Video': '看视频赚',
    'Shopping': '省钱秘籍'
};

// 全局缓存
window.allActivitiesCache = [];

// --------------------------------------------------------------------------------
// 辅助函数：数据加载
// --------------------------------------------------------------------------------
async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP 错误! Status: ${response.status}`);
            }
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                throw new Error(`非 JSON 格式: ${text}`);
            }
            return response;
        } catch (error) {
            console.warn(`Fetch attempt ${i + 1} failed for ${url}: ${error.message}`);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            } else {
                throw error;
            }
        }
    }
}

async function loadActivities() {
    const filePath = '../activities.json'; 
    const listContainer = document.getElementById('daily-tasks-list');
    if (listContainer) listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">正在加载活动数据...</p>`;

    try {
        const response = await fetchWithRetry(filePath, { method: 'GET', cache: 'no-cache' });
        const activities = await response.json();
        if (!Array.isArray(activities)) throw new Error("数据格式不正确，应为数组。");
        window.allActivitiesCache = activities;
        console.log(`[Load] 成功加载 ${activities.length} 条活动数据。`);
        return activities;
    } catch (error) {
        console.error(`加载 ${filePath} 失败:`, error);
        if (listContainer) {
            listContainer.innerHTML = `<div class="m-4 p-4 bg-red-800 text-white rounded-lg">
                <h5 class="font-bold text-highlight">数据加载失败</h5>
                <p>无法加载活动列表，请检查 'activities.json'</p>
                <p class="text-xs text-gray-200 mt-2">错误: ${error.message}</p>
            </div>`;
        }
        return [];
    }
}

// --------------------------------------------------------------------------------
// 辅助函数：渲染
// --------------------------------------------------------------------------------
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

function renderActivityCard(activity) {
    const deepLinkUrl = activity.deepLink || '#';
    const icon = getPlatformIcon(activity.sourceApp);
    const buttonText = '去参与';
    const buttonClass = 'status-pending';

    // 左侧边框颜色
    let borderColor = 'var(--color-secondary)';
    if (activity.category.includes('CheckIn')) borderColor = 'var(--color-primary)';
    else if (activity.category.includes('Video')) borderColor = 'var(--color-highlight)';
    else if (activity.category.includes('Bank')) borderColor = 'var(--color-success)';
    
    // 倒计时（只显示剩余天数）
    let countdownHtml = '';
    if (activity.deadline) {
        const today = new Date();
        const deadlineDate = new Date(activity.deadline);
        const diffTime = deadlineDate.setHours(0,0,0,0) - today.setHours(0,0,0,0);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        countdownHtml = diffDays > 0
            ? `<div class="countdown-badge">${diffDays} 天后截止</div>`
            : `<div class="countdown-badge expired-badge">已截止</div>`;
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

function renderFilteredActivities(targetCategoryEn, listContainer) {
    if (!window.allActivitiesCache || window.allActivitiesCache.length === 0) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">数据为空或加载失败。</p>`;
        return;
    }

    // 兼容字符串或数组，并忽略大小写
    const filteredActivities = window.allActivitiesCache.filter(activity => {
        if (!activity.category) return false;
        const catArr = Array.isArray(activity.category) ? activity.category : [activity.category];
        return catArr.map(c => c.toLowerCase()).includes(targetCategoryEn.toLowerCase());
    });

    console.log(`[Render] 过滤 '${targetCategoryEn}': 找到 ${filteredActivities.length} 条活动。`);

    if (filteredActivities.length === 0) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">当前分类 (${CATEGORY_DISPLAY_MAP[targetCategoryEn] || targetCategoryEn}) 暂无活动。</p>`;
    } else {
        const html = filteredActivities.map(renderActivityCard).join('');
        listContainer.innerHTML = html;
    }
}

// --------------------------------------------------------------------------------
// 事件监听器
// --------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('daily-tasks-list');
    const targetCategoryEn = document.body.getAttribute('data-category');

    if (!listContainer || !targetCategoryEn) {
        console.error("页面加载错误：缺少 'daily-tasks-list' 容器 ID 或 'data-category' 属性。");
        if (listContainer) listContainer.innerHTML = `<p class="text-red-400 text-center p-4">页面配置错误</p>`;
        return;
    }

    // 显示提示
    const statusWarning = document.getElementById('data-status-warning');
    if (statusWarning) {
        const categoryName = CATEGORY_DISPLAY_MAP[targetCategoryEn] || '活动';
        statusWarning.textContent = `⚠️ 提示：正在显示[${categoryName}]分类的最新活动。`;
        statusWarning.style.display = 'block';
    }

    // 加载数据
    await loadActivities();

    // 渲染
    renderFilteredActivities(targetCategoryEn, listContainer);
});
