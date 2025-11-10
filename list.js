/**
 * list.js - 活动列表核心逻辑
 * 支持 checkin, video, bank, shopping 四个页面
 */

// 页面类别映射
const CATEGORY_DISPLAY_MAP = {
    'CheckIn': '天天有奖',
    'Bank': '捡钱任务',
    'Video': '看视频赚',
    'Shopping': '省钱秘籍'
};

window.allActivitiesCache = [];

// ---------------------------------
// fetch + load
// ---------------------------------
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await fetch(url, { ...options, cache: 'no-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const contentType = res.headers.get('content-type');
            if (!contentType.includes('application/json')) {
                const text = await res.text();
                throw new Error(`非 JSON 数据: ${text}`);
            }
            return await res.json();
        } catch (err) {
            console.warn(`Fetch attempt ${i + 1} failed: ${err.message}`);
            if (i < maxRetries - 1) await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
            else throw err;
        }
    }
}

async function loadActivities() {
    const listContainer = document.getElementById('daily-tasks-list');
    if (listContainer) listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">正在加载活动数据...</p>`;
    try {
        const activities = await fetchWithRetry('../activities.json');
        if (!Array.isArray(activities)) throw new Error('数据格式不正确');
        window.allActivitiesCache = activities;
        console.log(`[Load] 共加载 ${activities.length} 条活动`);
        return activities;
    } catch (err) {
        console.error(err);
        if (listContainer) listContainer.innerHTML = `<p class="text-red-400 text-center p-4">活动加载失败：${err.message}</p>`;
        return [];
    }
}

// ---------------------------------
// 辅助渲染函数
// ---------------------------------
function getPlatformIcon(app) {
    if (!app) return 'fa-gift';
    if (app.includes('微信')) return 'fab fa-weixin';
    if (app.includes('支付宝')) return 'fab fa-alipay';
    if (app.includes('招商')) return 'fa-star';
    if (app.includes('建设')) return 'fa-building-columns';
    if (app.includes('拼多多')) return 'fa-shopping-bag';
    if (app.includes('快手')) return 'fa-video';
    if (app.includes('抖音')) return 'fa-mobile-screen';
    if (app.includes('淘宝')) return 'fa-store';
    if (app.includes('网上国网')) return 'fa-bolt';
    if (app.includes('中国银行')) return 'fa-university';
    return 'fa-gift';
}

function renderActivityCard(activity) {
    const icon = getPlatformIcon(activity.sourceApp);
    const buttonText = '去参与';
    const borderColor = activity.category.includes('CheckIn') ? 'var(--color-primary)' :
                        activity.category.includes('Video') ? 'var(--color-highlight)' :
                        activity.category.includes('Bank') ? 'var(--color-success)' :
                        'var(--color-secondary)';

    // 倒计时显示
    let countdownHtml = '';
    if (activity.deadline) {
        const deadline = new Date(activity.deadline).getTime();
        const now = Date.now();
        const diff = deadline - now;
        if (diff > 0) {
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            countdownHtml = `<div class="countdown-badge">${hours}h ${minutes}m ${seconds}s</div>`;
        } else {
            countdownHtml = `<div class="countdown-badge expired-badge">已过期</div>`;
        }
    }

    return `
    <div class="task-list-card" data-id="${activity.id}" style="border-left-color: ${borderColor};">
        ${countdownHtml}
        <div class="task-icon" style="background-color: ${borderColor};"><i class="fa-solid ${icon}"></i></div>
        <div class="task-content">
            <div class="task-title">${activity.name}</div>
            <div class="task-subtitle">奖励：${activity.specialNote || '标准奖励'} | 平台：${activity.sourceApp}</div>
            <div class="text-xs text-gray-500 mt-1">${activity.description}</div>
        </div>
        <div class="task-action">
            <a href="${activity.deepLink || '#'}" target="_blank" class="action-button">${buttonText}</a>
        </div>
    </div>`;
}

// ---------------------------------
// 渲染列表逻辑
// ---------------------------------
function renderList(category, listContainer, subCategory = null) {
    if (!window.allActivitiesCache.length) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">暂无数据</p>`;
        return;
    }

    let filtered = window.allActivitiesCache.filter(a => a.category.includes(category));

    // bank/shopping 页面按二级分类过滤
    if (subCategory) {
        filtered = filtered.filter(a => a.subCategory && a.subCategory.includes(subCategory));
    }

    if (!filtered.length) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">暂无活动</p>`;
        return;
    }

    listContainer.innerHTML = filtered.map(renderActivityCard).join('');
}

// ---------------------------------
// 页面初始化
// ---------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    const category = document.body.getAttribute('data-category');
    if (!category) return;

    await loadActivities();

    // 根据页面类型不同，选择渲染方式
    if (['CheckIn', 'Video'].includes(category)) {
        const listContainer = document.getElementById('daily-tasks-list');
        renderList(category, listContainer);
    } else if (['Bank', 'Shopping'].includes(category)) {
        const sections = document.querySelectorAll('.section-tasks');
        sections.forEach(sec => {
            const listId = sec.getAttribute('id');
            const subCat = sec.dataset.subcategory; // HTML 中设置 data-subcategory
            renderList(category, sec, subCat);
        });
    }
});
