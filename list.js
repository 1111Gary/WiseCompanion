// list.js - 修改版：读取本地 activities.json

const LIST_CONTAINER_ID = 'daily-tasks-list';

// 英文类别到中文标题的映射
const CATEGORY_DISPLAY_MAP = {
    'CheckIn': '天天有奖',
    'Bank': '捡钱任务',
    'Video': '看视频赚',
    'Shopping': '省钱秘籍'
};

// --------------------------------------------------------------------------------
// 辅助函数：App 唤起处理
// --------------------------------------------------------------------------------

function handleActivityClick(url) {
    if (!url || url === '#') {
        console.error("活动链接无效或缺失！");
        return;
    }
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
        console.log(`[Jump] 尝试在新窗口打开: ${url}`);
    } else {
        console.warn("抱歉，您的浏览器环境限制了自动跳转。");
    }
}
window.handleActivityClick = handleActivityClick;

// 辅助函数：根据平台名称返回 Font Awesome 图标
function getPlatformIcon(platformName) {
    if (!platformName) return 'fa-gift';
    const p = platformName;
    if (p.includes('微信')) return 'fab fa-weixin';
    if (p.includes('支付宝')) return 'fab fa-alipay';
    if (p.includes('招商')) return 'fa-star';
    if (p.includes('建设')) return 'fa-building-columns';
    if (p.includes('拼多多')) return 'fa-shopping-bag';
    if (p.includes('快手')) return 'fa-video';
    if (p.includes('抖音')) return 'fa-mobile-screen';
    if (p.includes('淘宝')) return 'fa-store';
    if (p.includes('网上国网')) return 'fa-bolt';
    if (p.includes('中国银行')) return 'fa-university';
    return 'fa-gift';
}

/**
 * 渲染单个活动卡片
 */
function renderActivityCard(activity) {
    // 字段映射：fetch-data.js 生成的是 link，这里对应之前的 deepLink
    const deepLinkUrl = activity.link || '#';
    const icon = getPlatformIcon(activity.sourceApp);

    const buttonText = '去参与';
    const buttonClass = 'status-pending';

    let borderColor = 'var(--color-secondary)';
    
    // fetch-data.js 生成的 category 是一个数组，例如 ['CheckIn', 'DailyTask']
    // 我们检查数组中是否包含特定关键词
    const categories = activity.category || [];

    if (categories.includes('CheckIn')) {
        borderColor = 'var(--color-primary)';
    } else if (categories.includes('Video')) {
        borderColor = 'var(--color-highlight)';
    } else if (categories.includes('Bank')) {
        borderColor = 'var(--color-success)';
    }

    return `
        <div class="task-list-card" data-id="${activity.id}" style="border-left-color: ${borderColor};">
            <div class="task-icon" style="background-color: ${borderColor};">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div class="task-content">
                <div class="task-title">${activity.name || '活动名称缺失'}</div>
                <div class="task-subtitle">奖励：${activity.specialNote || '标准奖励'} | 平台：${activity.sourceApp || '未知'}</div>
                <div class="text-xs text-gray-500 mt-1">${activity.description || '无描述'}</div>
            </div>
            <div class="task-action">
                <div onclick="handleActivityClick('${deepLinkUrl}')"
                    class="action-button ${buttonClass} flex items-center justify-center cursor-pointer">
                    ${buttonText}
                </div>
            </div>
        </div>
    `;
}

// --------------------------------------------------------------------------------
// 核心逻辑：数据加载和过滤 (读取本地 JSON)
// --------------------------------------------------------------------------------

/**
 * 渲染过滤后的活动列表
 */
function renderFilteredActivities(targetCategoryEn, activities) {
    const listContainer = document.getElementById(LIST_CONTAINER_ID);
    if (!listContainer) return;

    if (!activities || activities.length === 0) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">数据为空或加载失败。</p>`;
        return;
    }
    
    console.log(`>>> [DEBUG FILTER] 目标过滤类别: '${targetCategoryEn}'。原始数据: ${activities.length} 条。`);

    // 过滤逻辑：fetch-data.js 生成的 category 是数组
    const filteredActivities = activities.filter(activity => {
        const cats = activity.category; // 这是一个数组
        if (Array.isArray(cats)) {
            return cats.includes(targetCategoryEn);
        }
        return cats === targetCategoryEn;
    });

    console.log(`>>> [DEBUG RESULT] 过滤后找到 ${filteredActivities.length} 条活动。`);

    if (filteredActivities.length === 0) {
        const categoryName = CATEGORY_DISPLAY_MAP[targetCategoryEn] || targetCategoryEn;
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">当前分类 (${categoryName}) 暂无活动。</p>`;
    } else {
        const html = filteredActivities.map(renderActivityCard).join('');
        listContainer.innerHTML = html;
    }
}

/**
 * 从本地 JSON 文件加载数据
 */
async function loadLocalData(targetCategoryEn) {
    const listContainer = document.getElementById(LIST_CONTAINER_ID);
    if (!listContainer) return;
    
    listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">正在加载最新活动...</p>`;

    try {
        // 添加时间戳防止浏览器缓存旧的 json 文件
        const response = await fetch(`./activities.json?t=${new Date().getTime()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rawActivities = await response.json();
        console.log(`[DATA LOAD] 成功从本地文件加载 ${rawActivities.length} 条记录。`);
        
        // 渲染过滤后的结果
        renderFilteredActivities(targetCategoryEn, rawActivities);

    } catch (error) {
        console.error("加载本地数据失败:", error);
        listContainer.innerHTML = `<p class="text-red-500 p-4">加载数据失败，请稍后重试。<br><small>${error.message}</small></p>`;
    }
}

// --------------------------------------------------------------------------------
// 事件监听器 (主入口)
// --------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // 从 <body> 标签获取类别
    const targetCategoryEn = document.body.getAttribute('data-category'); 
    const listContainer = document.getElementById(LIST_CONTAINER_ID);

    if (!listContainer || !targetCategoryEn) {
        console.error("页面配置错误：缺少容器 ID 或 data-category 属性。");
        return;
    }
    
    // 1. 更新提示信息
    const statusWarning = document.getElementById('data-status-warning');
    if (statusWarning) {
        const categoryName = CATEGORY_DISPLAY_MAP[targetCategoryEn] || '活动';
        statusWarning.textContent = `提示：正在显示[${categoryName}]分类的最新活动。`;
        statusWarning.style.display = 'block';
    }

    // 2. 开始加载数据 (不再需要 Firebase 认证)
    loadLocalData(targetCategoryEn);
});