// --------------------------------------------------------------------------------
// Firebase Setup (No changes needed, keeping placeholders for consistency)
// --------------------------------------------------------------------------------

const apiKey = ""; // ⚠️ 警告: 真实部署时，请确保此密钥由安全机制注入，不要在此处硬编码您的真实密钥。
const baseId = "appvB8wO0F8F1Vz9W"; // 替换为你的 Base ID
const tableName = "Activity List"; // 替换为你的 Table Name
const apiUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;
const activitiesFilePath = 'activities.json'; // 用于 GitHub Pages 的缓存文件路径

// --------------------------------------------------------------------------------
// 核心配置：中文 Airtable 标签与英文 URL Hash 的映射关系
// --------------------------------------------------------------------------------

// 目标英文标签（用于 URL Hash 和过滤）
const TARGET_CATEGORIES = {
    'CheckIn': '签到',
    'Bank': '银行',
    'Video': '视频',
    'Shopping': '购物'
};

// 实际 Airtable 中文标签到目标英文标签的映射
// 根据您提供的截图，您的 Airtable 字段值是中文，因此我们需要这个映射来统一数据格式。
const CATEGORY_MAP = {
    '签到': 'CheckIn',
    '银行': 'Bank',
    '视频': 'Video',
    '购物': 'Shopping',
    // 确保所有可能出现的中文标签都在这里映射到对应的大写英文标签
};


// --------------------------------------------------------------------------------
// 辅助函数：从 AirTable 加载数据
// --------------------------------------------------------------------------------

// 实现指数退避的 fetch 函数
async function fetchWithRetry(url, options, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                // 仅对 4xx/5xx 错误抛出异常，以便重试
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        } catch (error) {
            console.warn(`Fetch attempt ${i + 1} failed for ${url}: ${error.message}`);
            if (i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error; // 最后一次尝试失败，向上抛出
            }
        }
    }
}

// 从 AirTable 获取数据并保存为 JSON 文件 (此函数主要用于后端或构建脚本)
async function fetchAndCacheActivities() {
    console.log("尝试从 AirTable 获取数据...");
    const headers = new Headers({
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    });

    const options = {
        method: 'GET',
        headers: headers
    };

    try {
        const response = await fetchWithRetry(apiUrl, options);
        const data = await response.json();
        const activities = data.records.map(record => {
            // 确保 category 是一个数组，并且将 Airtable 中的中文值映射成英文值
            let category = [];
            const rawCategories = record.fields.Category;

            if (Array.isArray(rawCategories)) {
                // 遍历 Airtable 中的中文标签，并映射成大写英文标签
                category = rawCategories
                    .map(c => CATEGORY_MAP[c.trim()] || c.trim()) // 使用 CATEGORY_MAP 进行映射
                    .filter(c => c); // 过滤掉无效值
            } else if (rawCategories) {
                 // 处理单个标签的情况
                const mappedCategory = CATEGORY_MAP[rawCategories.trim()] || rawCategories.trim();
                if (mappedCategory) {
                    category.push(mappedCategory);
                }
            }
            
            return {
                id: record.id,
                name: record.fields.Name || '无名称',
                description: record.fields.Description || '暂无描述',
                icon: record.fields.Icon || '', 
                deepLink: record.fields.DeepLink || '#',
                category: category, // **此处现在是统一后的英文标签**，例如 ['CheckIn', 'Bank']
                sourceApp: record.fields.SourceApp || '未知来源',
                specialNote: record.fields.SpecialNote || ''
            };
        });

        return activities;
    } catch (error) {
        console.error("从 AirTable 获取数据失败:", error);
        return null;
    }
}

// --------------------------------------------------------------------------------
// 辅助函数：从本地 JSON 文件加载数据 (用于前端加载)
// --------------------------------------------------------------------------------

async function loadActivities() {
    console.log(`尝试从本地 ${activitiesFilePath} 完整 URL: ${window.location.origin}/${activitiesFilePath}`);
    try {
        const response = await fetchWithRetry(activitiesFilePath, { method: 'GET' });
        const activities = await response.json();
        console.log("DEBUG - JSON加载成功，开始打印统一后的英文类别值...");
        // DEBUG: 打印实际类别值，用于调试
        activities.forEach((activity, index) => {
            console.log(`[DEBUG - 统一类别值] 活动 #${index + 1} (${activity.name}): `, activity.category);
        });
        console.log("--- DEBUG - 统一类别值打印结束 ---");

        // 缓存数据到全局变量
        window.allActivities = activities; 
        return activities;
    } catch (error) {
        console.error(`尝试从本地加载 ${activitiesFilePath} 失败，可能是文件不存在或权限问题:`, error);
        return [];
    }
}


// --------------------------------------------------------------------------------
// 渲染核心逻辑
// --------------------------------------------------------------------------------

/**
 * 渲染单个活动卡片。
 * @param {Object} activity 活动对象
 * @returns {string} HTML 字符串
 */
function renderActivityCard(activity) {
    const deepLinkUrl = activity.deepLink && activity.deepLink !== '#' ? activity.deepLink : '#';
    const cardClasses = "d-block p-3 mb-3 bg-secondary rounded-xl shadow-lg transform hover:scale-[1.02] transition duration-300 ease-in-out text-white no-underline";

    let iconContent;
    const iconValue = activity.icon;
    
    // 检查是否是 PWA 图标路径（避免 404），并使用 Font Awesome 占位符
    if (iconValue && iconValue.includes('/assets/icon_')) {
         iconContent = `<i class="fas fa-tasks"></i>`; 
    } else {
        if (iconValue && iconValue.startsWith('fa')) {
            iconContent = `<i class="${iconValue}"></i>`;
        } else {
            iconContent = iconValue || '📌'; // 确保总有内容
        }
    }

    // 渲染标签 (Tags) - 将英文标签转换回中文显示
    const tagsHtml = (activity.category || [])
        // 将英文标签（如 'CheckIn'）转换成更友好的中文显示
        .map(tag => {
            // 这个 Map 负责将内部英文 Category 转换成页面上显示的中文
            const displayMap = {
                'CheckIn': '签到',
                'Bank': '银行',
                'Video': '视频',
                'Shopping': '购物'
            };
            const displayText = displayMap[tag] || tag;
            return `<span class="badge bg-primary me-2">${displayText}</span>`;
        })
        .join('');
    
    // 渲染卡片
    return `
        <a href="${deepLinkUrl}" class="${cardClasses}" target="_blank" rel="noopener noreferrer">
            <div class="d-flex align-items-center">
                <!-- 图标/Emoji 容器 -->
                <div class="activity-icon-container bg-info text-white me-3" style="min-width: 40px; min-height: 40px;">
                    ${iconContent}
                </div>
                
                <!-- 内容区域 -->
                <div class="activity-content flex-grow-1">
                    <div class="activity-title">${activity.name}</div>
                    <div class="activity-desc">${activity.description}</div>
                    <div class="mt-1">${tagsHtml}</div>
                </div>
            </div>
            ${activity.specialNote ? `<div class="mt-2 text-warning text-sm font-semibold">${activity.specialNote}</div>` : ''}
        </a>
    `;
}

/**
 * 渲染过滤后的活动列表
 * @param {string} categoryHash 要过滤的 URL Hash 值，例如 'CheckIn'
 */
function renderFilteredActivities(categoryHash) {
    const listContainer = document.getElementById('activity-list');
    
    if (!window.allActivities) {
        listContainer.innerHTML = `<div class="p-4 text-center text-warning">数据尚未完全加载，请稍候...</div>`;
        return;
    }

    // 目标 Category 就是 URL Hash 值 (例如 'CheckIn')
    const targetCategoryEn = categoryHash;
    
    console.log(`[DEBUG] 正在过滤: 目标 URL Hash (统一英文标签): ${targetCategoryEn}`);

    // 2. 过滤活动：直接检查 activity.category 数组中是否包含目标英文标签
    // 注意：这里的 activity.category 已经被 fetchAndCacheActivities 映射成了英文标签
    const filteredActivities = window.allActivities.filter(activity => 
        // 确保 category 存在且包含目标英文标签
        activity.category && Array.isArray(activity.category) && activity.category.includes(targetCategoryEn)
    );
    
    console.log(`[DEBUG] 过滤结果: 找到 ${filteredActivities.length} 条活动。`);

    // 3. 渲染结果
    if (filteredActivities.length === 0) {
        listContainer.innerHTML = `<div class="p-4 text-center text-gray">当前分类 (${targetCategoryEn}) 暂无活动。</div>`;
    } else {
        const html = filteredActivities.map(renderActivityCard).join('');
        listContainer.innerHTML = html;
    }
}

// --------------------------------------------------------------------------------
// 事件监听器 (主入口)
// --------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    // 初始显示加载状态
    const listContainer = document.getElementById('activity-list');
    if (listContainer) {
        listContainer.innerHTML = `<div class="p-4 text-center text-info">数据加载中，请稍候...</div>`;
    }

    // 1. 尝试加载数据
    // 注意：如果您的数据是预先生成的 activities.json，请确保该 JSON 文件的数据结构已经将 Category 从中文转换成了英文标签！
    // 如果您直接从 AirTable API 加载，fetchAndCacheActivities 函数会完成这个转换。
    await loadActivities();

    // 2. 监听 URL Hash 变化并进行渲染
    function handleHashChange() {
        // 移除 '#' 并获取 hash 值
        const hash = window.location.hash.slice(1); 
        if (hash && window.allActivities) {
            renderFilteredActivities(hash);
        } else if (window.allActivities) {
             // 如果没有 hash，并且数据已加载 (通常在 index.html 上)
             listContainer.innerHTML = `<div class="p-4 text-center text-gray">请选择一个分类开始浏览。</div>`;
        }
    }

    // 监听 hash 变化 (用于 index.html 的筛选)
    window.addEventListener('hashchange', handleHashChange);

    // 第一次加载页面时，立即调用处理函数
    handleHashChange(); 
});
