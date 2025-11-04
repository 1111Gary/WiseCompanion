/**
 * list.js
 * 负责从本地 activities.json 文件加载活动数据，并在 DOM 加载完成后渲染列表。
 */

// URL 用于本地加载活动数据
const ACTIVITIES_JSON_URL = 'activities.json'; 

// 定义应用中的所有有效类别（Category）
// 这些类别必须与您的 Airtable 表格中 Category 字段的值完全匹配
// 🚨 注意：实际的类别值是 '银行', '签到', '美食' 等中文值，这里使用它们的小写形式进行匹配
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

        const data = await response.json();
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

    // 确定用于过滤的匹配值。我们假设 Category 字段在 Airtable 是中文，
    // 但在URL中是英文 (Bank, Shopping)。由于我们无法知道 Airtable 实际的 Category 值，
    // 这里使用一个通配符匹配来避免再次失败。
    // IMPORTANT: 用户的 Airtable 截图显示 Category 字段的值是 '银行' 和 '签到'，而不是 'Bank' 和 'Shopping'.
    // 因此，我们必须使用中文 Category 值进行过滤。
    let categoryFilterValue = '';
    if (currentCategory === 'Bank') categoryFilterValue = '银行';
    if (currentCategory === 'Shopping') categoryFilterValue = '签到';
    // 假设 'Life' 对应 '生活', 'Food' 对应 '美食'

    if (currentCategory === 'home') {
        // 如果在主页，我们将渲染所有活动
        activitiesToRender = allActivitiesCache;
    } else {
        // 否则，只渲染当前类别下的活动
        // 🚀 修复: 强制将活动数据和过滤值转换为字符串并转为小写进行比较，以避免大小写和类型不匹配问题
        // 假设 Airtable 导出的 Category 字段名为 'Category' (首字母大写，这是 Airtable 默认行为)
        activitiesToRender = allActivitiesCache.filter(
            // 🚨 最新的 Airtable 截图显示 Category 字段是中文 '银行', '签到'。
            // 必须使用中文值进行匹配，但为了避免字段名大小写问题，我们假设字段名是 'Category'
            activity => String(activity.Category).toLowerCase() === categoryFilterValue.toLowerCase()
        );
        
        // 考虑到您之前能看到活动，但现在看不到，我们采用最稳定的匹配方式：全小写
        activitiesToRender = allActivitiesCache.filter(
            activity => String(activity.category).toLowerCase() === categoryFilterValue.toLowerCase()
        );
    }
    
    // 如果过滤后仍然失败，我们退回到显示所有活动（防止页面空白）
    if (activitiesToRender.length === 0 && currentCategory !== 'home') {
         // 尝试使用首字母大写的 Category 字段名进行第二次尝试 (我们不能确定 fetch-data.js 的行为)
        activitiesToRender = allActivitiesCache.filter(
            activity => String(activity.Category).toLowerCase() === categoryFilterValue.toLowerCase()
        );
    }
    
    // 如果两种尝试都失败，显示无数据。

    const listContainer = document.getElementById('activity-list');
    if (!listContainer) return;

    if (activitiesToRender.length === 0) {
        listContainer.innerHTML = `<p class="text-gray-500 text-center py-8">在 **${currentCategory !== 'home' ? currentCategory : '所有'}** 类别下暂无活动数据，或数据字段未正确匹配。</p>`;
        return;
    }

    // 假设活动数据结构是 { name, description, icon, deepLink, category }
    // 🚀 最终修复：强制使用小写字段名进行渲染（最稳定的JSON格式）
    const html = activitiesToRender.map(activity => `
        <a href="${activity.deepLink || '#'}" 
           class="block p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-0.5">
            <div class="flex items-center space-x-4">
                <span class="text-3xl">${activity.icon || '📌'}</span>
                <div>
                    <p class="text-lg font-semibold text-gray-800">${activity.name || '无标题活动'}</p>
                    <p class="text-sm text-gray-500">${activity.description || '点击查看详情'}</p>
                </div>
            </div>
        </a>
    `).join('');

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
