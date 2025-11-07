/**
 * list.js - 活动列表核心逻辑 (前端客户端)
 * 职责：
 * 1. 从根目录的 activities.json 加载数据。
 * 2. 根据当前 HTML 页面的 data-category 属性，过滤活动。
 * 3. 渲染活动卡片，样式与 HTML 模板一致。
 */

// --------------------------------------------------------------------------------
// 核心配置与映射 (前端)
// --------------------------------------------------------------------------------

// 英文类别（来自JSON）到中文标题（用于页面显示）的映射
// 这用于在 data-status-warning 中显示正确的中文类别名称
const CATEGORY_DISPLAY_MAP = {
    'CheckIn': '天天有奖',
    'Bank': '捡钱任务',
    'Video': '看视频赚',
    'Shopping': '省钱秘籍'
};

// 确保在全局作用域中定义
window.allActivitiesCache = []; // 用于缓存从 JSON 加载的活动

// --------------------------------------------------------------------------------
// 辅助函数：数据加载
// --------------------------------------------------------------------------------

/**
 * 实现指数退避的 fetch 函数
 */
async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`错误 404: 未找到 'activities.json' 文件。请确保 GitHub Action 已成功运行并生成了此文件。`);
                }
                throw new Error(`HTTP 错误! Status: ${response.status}`);
            }
            // 检查 content-type 是否为 json
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error(`收到的响应不是 JSON 格式。请检查 'activities.json' 文件内容。`);
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

/**
 * 从本地 activities.json 文件加载数据
 * @returns {Promise<Array>} 活动列表数组
 */
async function loadActivities() {
    // 假设 list.js 在根目录, activities.json 也在根目录
    // 如果 list.js 在 /assets/js/ 目录, 路径应为 '../../activities.json'
    // 根据您的 GitHub 截图, list.js 在根目录, 所以路径是 'activities.json'
    // 【重要修正】: 您的 HTML 文件在 /WiseCompanion/ 目录下, list.js 在根目录。
    // HTML 引用 list.js 时应使用 <script src="../list.js"></script>
    // 而 list.js 访问 activities.json 时应使用 'activities.json' 或 './activities.json'
    
    // 鉴于您的 HTML 文件在 /WiseCompanion/ 目录中，而 list.js 和 activities.json 都在根目录
    // 您的 HTML 必须这样引用: <script src="../list.js"></script>
    // 相应的, list.js 应该这样访问:
    const filePath = 'activities.json'; 
    // 【或者，如果 list.js 和 HTML 在同一目录】
    // const filePath = 'activities.json'; 
    // 【或者，如果 list.js 在根目录, HTML 在子目录】
    // 您的 HTML 应该使用 <script src="../list.js"></script>
    // 您的 list.js 应该使用 const filePath = './activities.json';
    
    // 我们统一使用根路径引用，假设 list.js 和 activities.json 都在根目录
    const finalFilePath = 'activities.json';

    const listContainer = document.getElementById('daily-tasks-list'); // 对应您 checkin.html 的 ID
    if (listContainer) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">正在加载活动数据...</p>`;
    }

    try {
        // 使用 cache: 'no-cache' 确保总是获取最新的 JSON 文件
        const response = await fetchWithRetry(finalFilePath, { method: 'GET', cache: 'no-cache' });
        const activities = await response.json();
        
        if (!Array.isArray(activities)) {
             throw new Error("加载的数据格式不正确，应为数组。");
        }

        window.allActivitiesCache = activities; // 缓存数据
        console.log(`[Load] 成功加载 ${activities.length} 条活动数据。`);
        return activities;
    } catch (error) {
        console.error(`加载 ${finalFilePath} 失败:`, error);
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="m-4 p-4" style="background-color: #440000; border: 1px solid var(--color-highlight); color: white; border-radius: 15px;">
                    <h5 style="color: var(--color-highlight); font-weight: bold;">数据加载失败</h5>
                    <p>无法加载活动列表。请检查 'activities.json' 文件是否存在于项目根目录。</p>
                    <p style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 10px;">错误: ${error.message}</p>
                </div>`;
        }
        return [];
    }
}

// --------------------------------------------------------------------------------
// 辅助函数：渲染 (使用您 HTML 中的 CSS 变量和类名)
// --------------------------------------------------------------------------------

// 辅助函数：根据平台名称返回 Font Awesome 图标 (与您 checkin.html 中的一致)
function getPlatformIcon(platformName) {
    if (!platformName) return 'fa-gift'; // 默认图标
    if (platformName.includes('微信')) return 'fab fa-weixin';
    if (platformName.includes('支付宝')) return 'fab fa-alipay';
    if (platformName.includes('招商')) return 'fa-star';
    if (platformName.includes('建设')) return 'fa-building-columns';
    if (platformName.includes('拼多多')) return 'fa-shopping-bag';
    if (platformName.includes('快手')) return 'fa-video';
    if (platformName.includes('抖音')) return 'fa-mobile-screen';
    if (platformName.includes('淘宝')) return 'fa-store';
    return 'fa-gift'; // 默认图标
}


/**
 * 渲染单个活动卡片 (使用 checkin.html 中的样式)
 */
function renderActivityCard(activity) {
    const deepLinkUrl = activity.deepLink || '#';
    const icon = getPlatformIcon(activity.sourceApp);

    // (状态管理逻辑暂时移除，专注于显示和跳转)
    const buttonText = '去参与';
    const buttonClass = 'status-pending'; // 默认黄色

    // 【重要】: 确保字段名与 fetch-data.js 输出的 activities.json 一致 (小写)
    // { id, name, description, icon, deepLink, category, sourceApp, specialNote, targetApp }
    
    return `
        <div class="task-list-card" data-id="${activity.id}" style="border-left-color: var(--color-secondary);">
            <div class="task-icon" style="background-color: var(--color-secondary);">
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

/**
 * 渲染过滤后的活动列表
 * @param {string} targetCategoryEn - 要过滤的英文类别 (例如 'CheckIn')
 * @param {HTMLElement} listContainer - 目标 DOM 容器
 */
function renderFilteredActivities(targetCategoryEn, listContainer) {
    if (!window.allActivitiesCache) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">数据尚未加载。</p>`;
        return;
    }

    // 过滤活动：检查 activity.category 数组中是否包含目标英文标签
    const filteredActivities = window.allActivitiesCache.filter(activity => 
        activity.category && Array.isArray(activity.category) && activity.category.includes(targetCategoryEn)
    );
    
    console.log(`[Render] 过滤 '${targetCategoryEn}': 找到 ${filteredActivities.length} 条活动。`);

    if (filteredActivities.length === 0) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center p-4">当前分类 (${targetCategoryEn}) 暂无活动。</p>`;
    } else {
        const html = filteredActivities.map(renderActivityCard).join('');
        listContainer.innerHTML = html;
    }
}

// --------------------------------------------------------------------------------
// 事件监听器 (主入口)
// --------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    
    const listContainer = document.getElementById('daily-tasks-list'); // 对应您 checkin.html 的 ID
    // 从 HTML 标签的 data-category 属性获取当前页面需要什么数据
    const targetCategoryEn = document.body.getAttribute('data-category'); 
    
    if (!listContainer || !targetCategoryEn) {
        console.error("页面加载错误：缺少 'daily-tasks-list' 容器 ID，或者 <body> 标签缺少 'data-category' 属性。");
        if (listContainer) {
            listContainer.innerHTML = `<p class="text-red-400 text-center p-4">页面配置错误，请联系管理员。</p>`;
        }
        return;
    }

    // 1. 更新模拟数据提示
    const statusWarning = document.getElementById('data-status-warning');
    if (statusWarning) {
        statusWarning.textContent = `⚠️ 提示：当前数据最后更新于 GitHub Action 运行时间。`;
        statusWarning.style.display = 'block';
    }

    // 2. 加载数据
    await loadActivities();

    // 3. 渲染列表
    renderFilteredActivities(targetCategoryEn, listContainer);
});
