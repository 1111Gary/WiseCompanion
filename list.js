/**
 * list.js
 * 负责从本地 activities.json 文件加载活动数据，并在 DOM 加载完成后渲染列表。
 */

// URL 用于本地加载活动数据
const ACTIVITIES_JSON_URL = 'activities.json';

// 定义应用中的所有有效类别（Category）
// 这些类别必须与您的 URL hash 保持一致
const ALL_CATEGORIES = ['Bank', 'Shopping', 'Life', 'Food'];

// 类别中文映射 (根据您的 Airtable 截图修正)
const CATEGORY_MAP = {
    'Bank': '银行',
    'Shopping': '签到', // 映射到您的 "签到" 标签
    'Life': '视频',    // 映射到您的 "视频" 标签
    'Food': '美食',
};

let allActivitiesCache = []; // 用于缓存加载后的全部活动数据

// --- 辅助函数 ---

/**
 * 尝试从活动对象中安全地获取值，考虑大小写不一致。
 * @param {Object} activity - 活动记录对象。
 * @param {string} fieldName - 预期的字段名 (如 'Category', 'Name')。
 * @returns {any} 字段值或 null。
 */
function getSafeValue(activity, fieldName) {
    // 尝试所有可能的键名
    const keysToTry = [
        fieldName,
        fieldName.toLowerCase(), // category
        fieldName.charAt(0).toUpperCase() + fieldName.slice(1).toLowerCase(), // Category
        '分类', // 常用中文名
        '活动分类', // 备用中文名
    ];

    for (const key of keysToTry) {
        if (activity && activity[key] !== undefined) {
            // 找到匹配的键，返回其值
            return activity[key];
        }
    }
    // 如果是 fetch-data.js 格式化后的数据，我们应该能直接拿到 'category'
    if (activity && activity.category !== undefined) {
        return activity.category;
    }
    return null;
}

/**
 * 从 URL hash 中获取当前的活动类别。
 * @returns {string} 当前的类别，如果未指定或为无效类别则返回 'home'。
 */
function getCurrentCategory() {
    // 获取 URL hash，并去除 # 符号
    const hash = window.location.hash.slice(1);

    // 如果 hash 是 home 或空，或者 hash 不在定义的类别列表中，则返回 'home'
    if (hash === '' || hash === 'home' || !ALL_CATEGORIES.includes(hash)) {
        return 'home';
    }
    return hash;
}

/**
 * 显示错误信息（替换 alert()）。
 * @param {string} message - 要显示的消息。
 */
function displayErrorMessage(message) {
    const listContainer = document.getElementById('activity-list');
    if (listContainer) {
        listContainer.innerHTML = `
            <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-inner text-center">
                <p class="font-bold">错误:</p>
                <p>${message}</p>
            </div>
        `;
    } else {
        console.error(`UI 错误提示无法显示: ${message}`);
    }
}

// --- 数据加载和渲染 ---

/**
 * 从本地 JSON 文件加载活动数据。
 * @returns {Promise<Array>} 活动数组。
 */
async function loadActivities() {
    const fullUrl = new URL(ACTIVITIES_JSON_URL, window.location.href).href;
    console.log(`尝试从本地加载 activities.json。完整 URL: ${fullUrl}`);

    try {
        const response = await fetch(ACTIVITIES_JSON_URL);

        if (!response.ok) {
            throw new Error(`HTTP 错误 (Status: ${response.status})：无法获取 ${ACTIVITIES_JSON_URL}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
             throw new Error("JSON 数据格式错误，预期为数组。");
        }

        // 缓存所有数据
        allActivitiesCache = data;

        // 🚀 调试日志：打印出实际 Category 字段的值
        console.log("--- 🚀 DEBUG: JSON数据加载成功，开始打印类别值 ---");
        data.forEach((activity, index) => {
            const categoryValue = getSafeValue(activity, 'Category');
            console.log(`[DEBUG - 实际类别值] 活动 #${index + 1} (${activity.name || '无名'}):`, categoryValue);
        });
        console.log("--- 🚀 DEBUG: 类别值打印结束 ---");
        // --------------------------------------------------------

        return data;

    } catch (error) {
        console.error('加载活动数据失败:', error);
        displayErrorMessage('活动数据加载失败，请检查 activities.json 文件是否存在或路径是否正确。');
        return [];
    }
}

/**
 * 渲染活动列表到页面，并根据当前类别过滤。
 */
function renderFilteredActivities() {
    const currentCategory = getCurrentCategory();
    let activitiesToRender = [];
    
    if (currentCategory === 'home') {
        // 如果在主页，渲染所有活动
        activitiesToRender = allActivitiesCache;
    } else {
        // 否则，只渲染当前类别下的活动
        const categoryFilterValue = CATEGORY_MAP[currentCategory]; // 获取中文目标值 (如 '银行')

        console.log(`[DEBUG] 正在过滤。目标类别 URL Hash: ${currentCategory} -> 中文目标值: ${categoryFilterValue}`);

        // 🚀 最终的过滤逻辑：检查 Category 值是否包含目标中文值 (包括数组和字符串)
        activitiesToRender = allActivitiesCache.filter(activity => {
            const activityCategory = getSafeValue(activity, 'Category');
            
            // 如果数据是数组 (Airtable多选)，检查数组中是否包含目标中文值
            if (Array.isArray(activityCategory)) {
                // 强制将数组中的每个值去空格、小写化后，检查是否包含目标值
                return activityCategory.some(val => 
                    String(val).toLowerCase().trim().includes(categoryFilterValue.toLowerCase())
                );
            }

            // 如果数据是字符串，检查字符串是否包含目标中文值
            if (typeof activityCategory === 'string') {
                return activityCategory.toLowerCase().trim().includes(categoryFilterValue.toLowerCase());
            }

            // 否则，不匹配
            return false;
        });

        console.log(`[DEBUG] 过滤结果: 找到 ${activitiesToRender.length} 条活动。`);
    }

    const listContainer = document.getElementById('activity-list');
    if (!listContainer) return;

    if (activitiesToRender.length === 0 && currentCategory !== 'home') {
        listContainer.innerHTML = `<p class="text-gray-500 text-center py-8">在 **${CATEGORY_MAP[currentCategory]}** 类别下暂无活动数据，或数据匹配失败。</p>`;
        return;
    }

    if (activitiesToRender.length === 0 && currentCategory === 'home') {
        listContainer.innerHTML = '<p class="text-gray-500 text-center py-8">暂无活动数据。</p>';
        return;
    }

    // 假设活动数据结构是 { name, description, icon, deepLink, category, ... }
    const html = activitiesToRender.map(activity => {
        // 使用 fetch-data.js 中确定的字段名 (小写)
        const name = activity.name || getSafeValue(activity, 'Name');
        const icon = activity.icon || getSafeValue(activity, 'Icon');
        const deepLink = activity.deepLink || getSafeValue(activity, 'DeepLink');
        const description = activity.description || getSafeValue(activity, 'Description');

        return `
            <a href="${deepLink || '#'}" 
                class="block p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-0.5">
                <div class="flex items-center space-x-4">
                    <span class="text-3xl">${icon || '📌'}</span>
                    <div>
                        <p class="text-lg font-semibold text-gray-800">${name || '无标题活动'}</p>
                        <p class="text-sm text-gray-500">${description || '点击查看详情'}</p>
                    </div>
                </div>
            </a>
        `;
    }).join('');

    listContainer.innerHTML = html;
}

// --- 启动逻辑 ---

// DOM 加载完成后启动
document.addEventListener('DOMContentLoaded', async () => {
    // 1. 加载数据并缓存
    await loadActivities();

    // 2. 根据初始 URL 渲染列表
    renderFilteredActivities();
});

// 监听 URL hash 变化，实现简易路由
window.addEventListener('hashchange', () => {
    // 当 URL hash 变化时，重新过滤并渲染活动
    renderFilteredActivities();
});
