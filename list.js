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
        
        // 🚀 核心修复：数据标准化，将所有键名转换为小写
        data = data.map(item => {
            const standardizedItem = {};
            for (const key in item) {
                if (Object.prototype.hasOwnProperty.call(item, key)) {
                    standardizedItem[key.toLowerCase()] = item[key];
                }
            }
            return standardizedItem;
        });
        
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
    if (currentCategory === 'Bank') categoryFilterValue = '银行';
    if (currentCategory === 'Shopping') categoryFilterValue = '签到';
    if (currentCategory === 'Life') categoryFilterValue = '生活'; // 假设值
    if (currentCategory === 'Food') categoryFilterValue = '美食'; // 假设值

    if (currentCategory === 'home') {
        // 如果在主页，渲染所有活动
        activitiesToRender = allActivitiesCache;
    } else {
        // 否则，只渲染当前类别下的活动
        // 🚀 过滤修复：只使用标准化的全小写字段 'category' 进行匹配
        activitiesToRender = allActivitiesCache.filter(
            // 我们在 loadActivities 中已将所有键转换为小写
            activity => String(activity.category) === categoryFilterValue
        );
    }
    
    // ⚠️ 移除安全回退：现在我们应该相信过滤逻辑是正确的
    

    const listContainer = document.getElementById('activity-list');
    if (!listContainer) return;

    if (activitiesToRender.length === 0) {
        listContainer.innerHTML = `<p class="text-gray-500 text-center py-8">在 **${currentCategory !== 'home' ? categoryFilterValue : '所有'}** 类别下暂无活动数据。</p>`;
        return;
    }

    // 🚀 最终渲染修复：只使用标准化的全小写字段名进行渲染
    const html = activitiesToRender.map(activity => {
        // 确定正确的字段名（取值逻辑）
        // 此时所有字段都应该是小写的: name, description, icon, deepLink
        const name = activity.name || '无标题活动';
        const description = activity.description || '点击查看详情';
        const icon = activity.icon || '📌';
        const deepLink = activity.deeplink || '#'; // 注意 deeplink 也是全小写

        return `
            <a href="${deepLink}" 
               class="block p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-0.5">
                <div class="flex items-center space-x-4">
                    <span class="text-3xl">${icon}</span>
                    <div>
                        <p class="text-lg font-semibold text-gray-800">${name}</p>
                        <p class="text-sm text-gray-500">${description}</p>
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
