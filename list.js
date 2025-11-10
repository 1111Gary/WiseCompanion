/**
 * list.js - 活动列表核心逻辑 (bank.html 专用)
 * 功能：
 * 1. 从 ./activities.json 加载数据
 * 2. 根据标签 category 自动分配到日常/缴费/理财分类
 * 3. 渲染活动卡片
 * 4. 倒计时显示，自动刷新
 */

// --------------------------------------------------------------------------------
// 全局配置
// --------------------------------------------------------------------------------
window.allActivitiesCache = []; // 缓存数据

// 页面对应分类 ID
const CATEGORY_CONTAINER_MAP = {
    '日常活动': 'routine-tasks-list',
    '缴费活动': 'payment-tasks-list',
    '存款理财活动': 'savings-tasks-list'
};

// 倒计时每秒刷新
let countdownInterval = null;

// --------------------------------------------------------------------------------
// 辅助函数：fetch JSON 数据
// --------------------------------------------------------------------------------
async function fetchActivities() {
    try {
        const response = await fetch('./activities.json', { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('返回数据不是数组');
        window.allActivitiesCache = data;
        return data;
    } catch (err) {
        console.error('加载活动数据失败:', err);
        Object.values(CATEGORY_CONTAINER_MAP).forEach(id => {
            const container = document.getElementById(id);
            if (container) container.innerHTML = `<p class="text-gray-400 text-center p-4">数据加载失败</p>`;
        });
        return [];
    }
}

// --------------------------------------------------------------------------------
// 渲染单个活动卡片
// --------------------------------------------------------------------------------
function renderActivityCard(activity) {
    const deepLinkUrl = activity.deepLink || '#';
    const icon = getPlatformIcon(activity.sourceApp);
    const buttonText = '去参与';
    const buttonClass = 'status-pending';

    let borderColor = 'var(--color-secondary)';
    if (activity.category.includes('日常活动')) borderColor = 'var(--color-success)';
    else if (activity.category.includes('缴费活动')) borderColor = 'var(--color-primary)';
    else if (activity.category.includes('存款理财活动')) borderColor = 'var(--color-highlight)';

    const endDate = activity.endDate || null;
    const countdownHtml = endDate
        ? `<span class="countdown-badge" data-endtime="${endDate}">计算中...</span>`
        : `<span class="countdown-badge">无倒计时</span>`;

    return `
        <div class="task-list-card" data-id="${activity.id}" style="border-left-color: ${borderColor}; position: relative;">
            ${countdownHtml}
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
                   class="action-button ${buttonClass} flex items-center justify-center">
                    ${buttonText}
                </a>
            </div>
        </div>
    `;
}

// --------------------------------------------------------------------------------
// 渲染所有分类
// --------------------------------------------------------------------------------
function renderAllCategories() {
    if (!window.allActivitiesCache.length) return;

    // 清空容器
    Object.values(CATEGORY_CONTAINER_MAP).forEach(id => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = '';
    });

    // 遍历活动
    window.allActivitiesCache.forEach(activity => {
        if (!activity.category || !Array.isArray(activity.category)) return;
        activity.category.forEach(cat => {
            const containerId = CATEGORY_CONTAINER_MAP[cat];
            const container = document.getElementById(containerId);
            if (container) container.innerHTML += renderActivityCard(activity);
        });
    });

    startCountdownUpdater(); // 渲染完后启动倒计时
}

// --------------------------------------------------------------------------------
// 倒计时逻辑
// --------------------------------------------------------------------------------
function updateCountdowns() {
    const badges = document.querySelectorAll('.countdown-badge[data-endtime]');
    const now = new Date().getTime();

    badges.forEach(badge => {
        const endTime = new Date(badge.getAttribute('data-endtime')).getTime();
        const distance = endTime - now;

        if (distance <= 0) {
            badge.textContent = '已过期';
            badge.classList.add('expired-badge');
            return;
        }

        const days = Math.floor(distance / (1000*60*60*24));
        const hours = Math.floor((distance % (1000*60*60*24)) / (1000*60*60));
        const minutes = Math.floor((distance % (1000*60*60)) / (1000*60));
        const seconds = Math.floor((distance % (1000*60)) / 1000);

        let timeString = '';
        if (days > 0) timeString = `${days} 天 ${hours} 时`;
        else if (hours > 0) timeString = `${hours} 时 ${minutes} 分`;
        else timeString = `${minutes} 分 ${seconds} 秒`;

        badge.textContent = `剩余 ${timeString}`;
        badge.classList.remove('expired-badge');
    });
}

function startCountdownUpdater() {
    if (countdownInterval) clearInterval(countdownInterval);
    updateCountdowns();
    countdownInterval = setInterval(updateCountdowns, 1000);
}

// --------------------------------------------------------------------------------
// 辅助函数：获取图标
// --------------------------------------------------------------------------------
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

// --------------------------------------------------------------------------------
// 页面加载主入口
// --------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    const statusWarning = document.getElementById('data-status-warning');
    if (statusWarning) {
        statusWarning.textContent = '⚠️ 提示：正在显示最新活动，倒计时根据 endDate 字段自动计算';
        statusWarning.style.display = 'block';
    }

    await fetchActivities();
    renderAllCategories();
});
