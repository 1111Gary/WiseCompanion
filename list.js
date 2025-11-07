/**
 * list.js - 活动列表核心逻辑 (前端客户端)
 * 职责：
 * 1. 从 activities.json 加载数据 (使用指数退避确保稳定性)。
 * 2. 根据 URL 路径（文件名）确定的中文主分类进行过滤。
 * 3. 渲染 SourceApp (来源应用) 二级筛选按钮并处理点击事件。
 * 4. 使用 Bootstrap 样式渲染活动卡片。
 */

const activitiesFilePath = 'activities.json';
window.allActivities = []; // 全局存储所有活动数据

// --------------------------------------------------------------------------------
// 核心配置与映射
// --------------------------------------------------------------------------------

// 定义中文分类（来自文件名/HTML）到英文 URL/数据标签（来自 activities.json）的映射
const CHINESE_TO_ENGLISH_MAP = {
    '签到': 'CheckIn',
    '银行': 'Bank',
    '视频': 'Video',
    '购物': 'Shopping'
};

// --------------------------------------------------------------------------------
// 辅助函数：数据加载 (保持指数退避)
// --------------------------------------------------------------------------------

/**
 * 实现指数退避的 fetch 函数，用于增加加载稳定性
 */
async function fetchWithRetry(url, options, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response;
        } catch (error) {
            console.warn(`Fetch attempt ${i + 1} failed for ${url}: ${error.message}`);
            if (i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
}

/**
 * 从本地 JSON 文件加载数据
 * @returns {Array} 活动列表数组
 */
async function loadActivities() {
    const listContainer = document.getElementById('activity-list');
    // 显示加载中状态
    if (listContainer) {
        listContainer.innerHTML = `<div class="p-4 text-center text-secondary">数据加载中，请稍候...</div>`;
    }

    try {
        const response = await fetchWithRetry(activitiesFilePath, { method: 'GET' });
        const activities = await response.json();
        
        window.allActivities = activities;
        console.log(`[Load] 成功加载 ${activities.length} 条活动数据。`);
        return activities;
    } catch (error) {
        console.error(`尝试从本地加载 ${activitiesFilePath} 失败:`, error);
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="alert alert-danger mt-4" role="alert" style="background-color: #dc354522; border-color: #dc3545; color: #dc3545;">
                    <h5 class="alert-heading text-danger">数据加载失败</h5>
                    <p>无法连接到或解析 ${activitiesFilePath} 文件。</p>
                    <hr style="border-top: 1px solid #dc3545;">
                    <p class="mb-0" style="font-size: 0.85rem;">错误信息: ${error.message}</p>
                </div>`;
        }
        return [];
    }
}

// --------------------------------------------------------------------------------
// 辅助函数：过滤与渲染
// --------------------------------------------------------------------------------

/**
 * 根据中文主分类过滤活动列表。
 */
function filterActivities(chineseCategory) {
    const englishCategory = CHINESE_TO_ENGLISH_MAP[chineseCategory];

    if (!englishCategory || !window.allActivities.length) {
        return [];
    }

    const filtered = window.allActivities.filter(activity =>
        activity.category && Array.isArray(activity.category) && activity.category.includes(englishCategory)
    );
    
    return filtered;
}


/**
 * 渲染单个活动卡片 (使用 Bootstrap 样式)。
 */
function renderActivityCard(activity) {
    const deepLinkUrl = activity.deepLink && activity.deepLink !== '#' ? activity.deepLink : '#';
    
    // 图标处理
    let iconContent = activity.icon || '📌'; 
    if (activity.icon && activity.icon.startsWith('fa')) {
        iconContent = `<i class="${activity.icon}"></i>`;
    }

    // 渲染标签
    const tagsHtml = (activity.category || [])
        .map(tag => {
            const displayText = Object.keys(CHINESE_TO_ENGLISH_MAP).find(key => CHINESE_TO_ENGLISH_MAP[key] === tag) || tag;
            const pageTitleDisplay = document.getElementById('page-title-display')?.textContent || '';
            const match = pageTitleDisplay.match(/[\u4e00-\u9fa5]+/);
            const mainCategoryChinese = match ? match[0] : '';

            // 避免重复显示主分类标签
            if (displayText === mainCategoryChinese) {
                 return '';
            }
            // 使用 Bootstrap 标签样式
            return `<span class="badge rounded-pill text-bg-secondary me-2" style="background-color: #6366f1 !important;">${displayText}</span>`;
        })
        .join('');

    return `
        <a href="${deepLinkUrl}" class="activity-card mb-3" target="_blank" rel="noopener noreferrer">
            <!-- 图标/Emoji 容器 -->
            <div class="activity-icon-container bg-info text-white">
                ${iconContent}
            </div>
            
            <!-- 内容区域 -->
            <div class="activity-content">
                <div class="activity-title">${activity.name}</div>
                <div class="activity-desc">${activity.description}</div>
                
                <div class="d-flex align-items-center mt-2" style="min-height: 20px;">
                    <small class="text-secondary me-3" style="color: #94a3b8 !important;">来源: ${activity.sourceApp || '未知'}</small>
                    <div class="flex-grow-1 overflow-hidden">${tagsHtml}</div>
                </div>
            </div>
            
            <!-- 特别提醒 -->
            ${activity.specialNote ? `<div class="ms-3 text-warning font-weight-bold text-end" style="font-size: 0.75rem; white-space: nowrap; color: #facc15 !important;">${activity.specialNote}</div>` : ''}
            
            <!-- 链接箭头 -->
            <div class="ms-3 align-self-center text-muted" style="font-size: 1rem;"><i class="fas fa-chevron-right"></i></div>
        </a>
    `;
}

/**
 * 渲染活动列表到指定容器
 */
function renderActivities(activities, containerId) {
    const listContainer = document.getElementById(containerId);
    if (!listContainer) return;

    if (activities.length === 0) {
        listContainer.innerHTML = `
            <div class="alert alert-info text-center mt-4 bg-transparent border border-info text-white" role="alert" style="border-color: #0d6efd; color: #00bfff;">
                <i class="fas fa-search-minus me-2"></i>
                当前筛选条件下暂无活动。
            </div>`;
    } else {
        const html = activities.map(renderActivityCard).join('');
        listContainer.innerHTML = html;
    }
}


/**
 * 渲染二级筛选按钮 (按 SourceApp) 并绑定点击事件。
 */
function renderAppFilters(initialActivities, mainCategory, filterContainerId, listContainerId) {
    const filterContainer = document.getElementById(filterContainerId);
    if (!filterContainer) return;

    // 1. 提取所有 SourceApp (来源应用) 并去重
    const uniqueApps = initialActivities.reduce((set, activity) => {
        if (activity.sourceApp) {
            set.add(activity.sourceApp);
        }
        return set;
    }, new Set());

    const sortedApps = Array.from(uniqueApps).sort();

    const baseButtonClasses = "btn btn-outline-secondary filter-button me-2";
    
    // 添加 "全部" 按钮
    let buttonsHtml = `
        <button class="${baseButtonClasses} active" data-filter="all">
            <i class="fas fa-list-ul me-1"></i> 全部 (${initialActivities.length})
        </button>
    `;

    // 添加 SourceApp 按钮
    sortedApps.forEach(app => {
        const count = initialActivities.filter(a => a.sourceApp === app).length;
        buttonsHtml += `
            <button class="${baseButtonClasses}" data-filter="${app}">
                ${app} (${count})
            </button>
        `;
    });

    filterContainer.innerHTML = buttonsHtml;
    
    // 2. 初始渲染 (渲染全部)
    renderActivities(initialActivities, listContainerId);

    // 3. 绑定点击事件
    filterContainer.addEventListener('click', (event) => {
        const button = event.target.closest('.filter-button');
        if (!button) return;

        const filterValue = button.getAttribute('data-filter');
        
        filterContainer.querySelectorAll('.filter-button').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        let filteredList = [];

        if (filterValue === 'all') {
            filteredList = initialActivities;
        } else {
            filteredList = initialActivities.filter(activity => 
                activity.sourceApp === filterValue
            );
        }

        renderActivities(filteredList, listContainerId);
    });
}

// --------------------------------------------------------------------------------
// 暴露公共 API (供 HTML 内联脚本调用)
// --------------------------------------------------------------------------------
window.loadActivities = loadActivities;
window.filterActivities = filterActivities;
window.renderAppFilters = renderAppFilters;
