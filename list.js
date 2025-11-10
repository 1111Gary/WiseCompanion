/**
 * list.js - 活动列表核心逻辑 (前端客户端)
 * 支持 CheckIn / Video / Bank / Shopping 页面
 * Bank 页面支持三类子分类渲染到对应容器
 */

const CATEGORY_DISPLAY_MAP = {
    'CheckIn': '天天有奖',
    'Video': '看视频赚',
    'Bank': '捡钱任务',
    'Shopping': '省钱秘籍'
};

// Bank 页面子分类映射
const BANK_SUBCATEGORY_MAP = {
    'DailyTask': 'routine-tasks-list',
    'Payment': 'payment-tasks-list',
    'Savings': 'savings-tasks-list'
};

window.allActivitiesCache = [];

// fetch JSON
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, { ...options, cache: 'no-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                throw new Error(`非 JSON 数据: ${text}`);
            }
            return await response.json();
        } catch (err) {
            console.warn(`Fetch attempt ${i + 1} failed: ${err.message}`);
            if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
            else throw err;
        }
    }
}

// 平台图标
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

// 渲染单个活动
function renderActivityCard(activity) {
    const deepLinkUrl = activity.deepLink || '#';
    const icon = getPlatformIcon(activity.sourceApp);
    let borderColor = 'var(--color-secondary)'; // 默认颜色
    if (activity.category.includes('CheckIn')) borderColor = 'var(--color-primary)';
    if (activity.category.includes('Video')) borderColor = 'var(--color-highlight)';
    if (activity.category.includes('Bank')) borderColor = 'var(--color-success)';
    
    return `
        <div class="task-list-card" data-id="${activity.id}" style="border-left-color: ${borderColor};">
            <div class="task-icon" style="background-color: ${borderColor};">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div class="task-content">
                <div class="task-title">${activity.name}</div>
                <div class="task-subtitle">奖励：${activity.specialNote || '标准奖励'} | 平台：${activity.sourceApp}</div>
                <div class="text-xs text-gray-500 mt-1">${activity.description}</div>
            </div>
            <div class="task-action">
                <a href="${deepLinkUrl}" target="_blank" rel="noopener noreferrer" 
                   class="action-button status-pending flex items-center justify-center">去参与</a>
            </div>
        </div>
    `;
}

// 渲染 Bank 页面三类子分类
function renderBankActivities() {
    const targetCategory = 'Bank';
    Object.keys(BANK_SUBCATEGORY_MAP).forEach(subcat => {
        const containerId = BANK_SUBCATEGORY_MAP[subcat];
        const container = document.getElementById(containerId);
        if (!container) return;
        const filtered = window.allActivitiesCache.filter(act =>
            act.category.includes(targetCategory) && act.category.includes(subcat)
        );
        if (filtered.length === 0) {
            container.innerHTML = `<p class="text-gray-400 text-center p-4">暂无活动</p>`;
        } else {
            container.innerHTML = filtered.map(renderActivityCard).join('');
        }
    });
}

// 渲染其他页面
function renderOtherActivities(targetCategory, container) {
    const filtered = window.allActivitiesCache.filter(act => act.category.includes(targetCategory));
    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-gray-400 text-center p-4">暂无活动</p>`;
    } else {
        container.innerHTML = filtered.map(renderActivityCard).join('');
    }
}

// 页面入口
document.addEventListener('DOMContentLoaded', async () => {
    const targetCategory = document.body.getAttribute('data-category');
    if (!targetCategory) return console.error('缺少 data-category');
    
    // 状态提示
    const statusWarning = document.getElementById('data-status-warning');
    if (statusWarning) {
        const categoryName = CATEGORY_DISPLAY_MAP[targetCategory] || targetCategory;
        statusWarning.textContent = `⚠️ 提示：正在显示 [${categoryName}] 分类的最新活动。`;
    }
    
    try {
        window.allActivitiesCache = await fetchWithRetry('./activities.json');
    } catch (err) {
        console.error('加载 activities.json 失败:', err);
        return;
    }
    
    if (targetCategory === 'Bank') {
        renderBankActivities();
    } else {
        const listContainer = document.getElementById('daily-tasks-list');
        if (listContainer) renderOtherActivities(targetCategory, listContainer);
    }
});
