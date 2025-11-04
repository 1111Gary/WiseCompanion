/**
 * list.js
 * 负责从本地 activities.json 文件加载活动数据，并在 DOM 加载完成后渲染列表。
 */

// URL 用于本地加载活动数据
const ACTIVITIES_JSON_URL = 'activities.json'; 

// 定义应用中的所有有效类别（Category）
// 这些类别必须与您的 Airtable 表格中 Category 字段的值完全匹配
const ALL_CATEGORIES = ['Bank', 'Shopping', 'Life', 'Food']; 
let allActivitiesCache = []; // 用于缓存加载后的全部活动数据

// --- 辅助函数 ---

/**
 * 从 URL hash 中获取当前的活动类别。
 * @returns {string} 当前的类别，如果未指定或为无效类别则返回 'home'。
 */
function getCurrentCategory() {
    // 获取 URL hash，并去除 # 符号
    const hash = window.location.hash.slice(1);
    
    // 如果 hash 是 home 或空，则返回 'home'
    if (hash === '' || hash === 'home') {
        return 'home';
    }
    
    // 检查 hash 是否与我们定义的有效类别匹配
    if (ALL_CATEGORIES.includes(hash)) {
        return hash;
    }

    // 如果是无效类别，默认返回 home
    return 'home';
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

/**
 * 尝试从活动对象中安全获取指定字段的值。
 * 检查顺序：1. 全小写 2. 首字母大写 3. 常见中文键名
 * @param {object} activity - 活动对象。
 * @param {string} englishName - 字段名称 (例如 'Name', 'Category')。
 * @returns {string|null} 字段值或 null。
 */
function getSafeValue(activity, englishName) {
    // 1. 检查全小写 (假设 fetch-data.js 转换了)
    const lowerCaseName = englishName.toLowerCase();
    if (activity[lowerCaseName]) {
        return activity[lowerCaseName];
    }
    
    // 2. 检查首字母大写 (Airtable 原始)
    if (activity[englishName]) {
        return activity[englishName];
    }

    // 3. 检查常见中文键名 (以防 fetch-data.js 保留中文)
    const chineseMapping = {
        'Name': '活动名称', 
        'Description': '描述', 
        'Icon': '图标',
        'DeepLink': '链接',
        'Category': '分类' 
    };

    const chineseName = chineseMapping[englishName];
    if (chineseName && activity[chineseName]) {
        return activity[chineseName];
    }
    
    // 如果找不到，返回 null
    return null;
}


// --- 数据加载和渲染 ---

/**
 * 从本地 JSON 文件加载活动数据。
 * @returns {Promise<Array>} 活动数组。
 */
async function loadActivities() {
    try {
        const response = await fetch(ACTIVITIES_JSON_URL);

        if (!response.ok) {
            // 如果文件不存在或服务器返回错误，抛出错误
            throw new Error(`HTTP 错误 (Status: ${response.status})：无法获取 ${ACTIVITIES_JSON_URL}`);
        }

        let data = await response.json();
        if (!Array.isArray(data)) {
             throw new Error("JSON 数据格式错误，预期为数组。");
        }
        
        // 缓存所有数据
        allActivitiesCache = data;
        return data;

    } catch (error) {
        console.error('加载活动数据失败:', error);
        displayErrorMessage('活动数据加载失败，请检查部署是否成功或联系管理员。');
        return [];
    }
}

/**
 * 渲染活动列表到页面，并根据当前类别过滤。
 */
function renderFilteredActivities() {
    const currentCategory = getCurrentCategory();
    let activitiesToRender = [];

    // 确定用于过滤的匹配值 (使用中文值，基于您的 Airtable 截图)
    let categoryFilterValue = '';
    // 注意：这里的中文值 '银行', '签到', '生活', '美食' 必须与 Airtable Category 字段的值完全匹配
    if (currentCategory === 'Bank') categoryFilterValue = '银行';
    if (currentCategory === 'Shopping') categoryFilterValue = '签到';
    if (currentCategory === 'Life') categoryFilterValue = '生活'; 
    if (currentCategory === 'Food') categoryFilterValue = '美食'; 

    if (currentCategory === 'home') {
        // 如果在主页，渲染所有活动
        activitiesToRender = allActivitiesCache;
    } else {
        // 否则，只渲染当前类别下的活动
        // 🚀 过滤修复：使用 trim() 移除从数据中获取的类别值两端的空格，确保精确匹配
        activitiesToRender = allActivitiesCache.filter(
            activity => {
                const activityCategory = getSafeValue(activity, 'Category');
                // 确保 activityCategory 是字符串且移除空格后与目标值匹配
                return activityCategory && String(activityCategory).trim() === categoryFilterValue;
            }
        );
    }
    
    const listContainer = document.getElementById('activity-list');
    if (!listContainer) return;

    if (activitiesToRender.length === 0) {
        listContainer.innerHTML = `<p class="text-gray-500 text-center py-8">在 **${currentCategory !== 'home' ? categoryFilterValue : '所有'}** 类别下暂无活动数据。</p>`;
        return;
    }

    // 🚀 渲染：使用 getSafeValue 安全获取所有字段
    const html = activitiesToRender.map((activity, index) => {
        // 使用 getSafeValue 确保我们能取到 Name, Description, Icon, DeepLink
        const name = getSafeValue(activity, 'Name');
        const description = getSafeValue(activity, 'Description');
        const icon = getSafeValue(activity, 'Icon');
        const deepLink = getSafeValue(activity, 'DeepLink');
        
        // 检查 Name 字段是否缺失并打印警告
        if (!name) {
            console.warn(`活动数据缺失警告 (索引 ${index + 1}): 'Name' 字段未找到。当前活动数据:`, activity);
        }
        
        // 使用回退值
        const displayName = name || '无标题活动';
        const displayDescription = description || '点击查看详情';
        const displayIcon = icon || '📌';
        const displayDeepLink = deepLink || '#'; 

        return `
            <a href="${displayDeepLink}" 
               class="block p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-0.5">
                <div class="flex items-center space-x-4">
                    <span class="text-3xl">${displayIcon}</span>
                    <div>
                        <p class="text-lg font-semibold text-gray-800">${displayName}</p>
                        <p class="text-sm text-gray-500">${displayDescription}</p>
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
