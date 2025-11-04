/**
 * list.js
 * 负责从本地 activities.json 文件加载活动数据，并在 DOM 加载完成后渲染列表。
 */

// URL 用于本地加载活动数据，现在使用相对路径确保在子目录中也能找到
const ACTIVITIES_JSON_URL = 'activities.json'; 

/**
 * 从本地 JSON 文件加载活动数据。
 * @returns {Promise<Array>} 活动数组。
 */
async function loadActivities() {
    // 打印出 fetch 的完整 URL，以便在浏览器开发者工具中检查网络请求
    const fullUrl = new URL(ACTIVITIES_JSON_URL, window.location.href).href;
    console.log(`尝试从本地加载 activities.json。完整 URL: ${fullUrl}`);

    try {
        const response = await fetch(ACTIVITIES_JSON_URL);

        // 检查 HTTP 状态码是否成功 (例如 200 OK)
        if (!response.ok) {
            // 如果文件不存在 (404) 或其他错误，抛出错误
            throw new Error(`HTTP 错误 (Status: ${response.status})：无法获取 ${ACTIVITIES_JSON_URL}`);
        }

        // 尝试解析 JSON
        const data = await response.json();
        // 检查数据是否是数组
        if (!Array.isArray(data)) {
             throw new Error("JSON 数据格式错误，预期为数组。");
        }
        return data;

    } catch (error) {
        console.error('加载活动数据失败:', error);
        // 使用一个更友好的方式替换 alert()
        displayErrorMessage('活动数据加载失败，请检查部署是否成功或联系管理员。');
        return [];
    }
}

/**
 * 渲染活动列表到页面。
 * @param {Array} activities - 活动数组。
 */
function renderActivities(activities) {
    const listContainer = document.getElementById('activity-list');
    if (!listContainer) return;

    if (activities.length === 0) {
        listContainer.innerHTML = '<p class="text-gray-500 text-center py-8">暂无活动数据。</p>';
        return;
    }

    // 假设活动数据结构是 { name, description, icon, deepLink }
    const html = activities.map(activity => `
        <a href="${activity.deepLink || '#'}" 
           class="block p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-0.5">
            <div class="flex items-center space-x-4">
                <span class="text-3xl">${activity.icon || '📌'}</span>
                <div>
                    <p class="text-lg font-semibold text-gray-800">${activity.name}</p>
                    <p class="text-sm text-gray-500">${activity.description || '点击查看详情'}</p>
                </div>
            </div>
        </a>
    `).join('');

    listContainer.innerHTML = html;
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
        // 作为备用，如果容器不存在，则直接打印到控制台
        console.error(`UI 错误提示无法显示: ${message}`);
    }
}


// DOM 加载完成后启动
document.addEventListener('DOMContentLoaded', async () => {
    // 1. 加载数据
    const activities = await loadActivities();
    
    // 2. 渲染列表
    renderActivities(activities);
});

// 在 `fetch-data.js` 中，我们决定将数据写入 `activities.json`
// 确保 `fetch-data.js` 中的文件写入路径是正确的，并且在 actions 中成功运行。
