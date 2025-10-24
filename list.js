// list.js

// ----------------------------------------------------
// ⚠️ 敏感信息：您的 Airtable 密钥和 Base ID
// 它们已在代码中硬编码，请确保它们不会被恶意使用。
// ----------------------------------------------------
const TABLE_NAME = 'Activities'; // 确保您的表格名称是 Activities

// Airtable API URL
const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

// 存储所有活动数据
let allActivities = [];

/**
 * 核心函数：从 Airtable 加载所有活动数据
 */
async function loadActivities() {
    try {
        const response = await fetch(AIRTABLE_URL, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_PAT}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.statusText}`);
        }

        const data = await response.json();
        // 格式化数据，只保留我们需要的字段
        allActivities = data.records.map(record => ({
            id: record.id,
            name: record.fields.Name || '无标题活动',
            description: record.fields.Description || '暂无描述',
            icon: record.fields.Icon || '❓',
            deepLink: record.fields.DeepLink || '#',
            category: record.fields.Category || [], // 这是一个数组
            sourceApp: record.fields.SourceApp || '其他',
            specialNote: record.fields.SpecialNote || null
        }));
        
        console.log('活动数据加载成功:', allActivities);
        return allActivities;

    } catch (error) {
        console.error('加载活动数据失败:', error);
        alert('活动数据加载失败，请检查网络或联系管理员。');
        return [];
    }
}

/**
 * 过滤函数：根据页面需求过滤活动
 * @param {string} requiredCategory - 必需的 Category 标签 (例如: '银行', '签到')
 * @param {string|null} filterApp - 可选的 SourceApp 筛选名称 (例如: '交通银行')
 */
function filterActivities(requiredCategory, filterApp = null) {
    let filteredList = allActivities.filter(activity => 
        // 检查 Category 字段是否包含必需的标签
        activity.category && activity.category.includes(requiredCategory)
    );

    if (filterApp && filterApp !== '全部') {
        filteredList = filteredList.filter(activity => 
            activity.sourceApp === filterApp
        );
    }

    return filteredList;
}

/**
 * 生成 HTML 卡片并添加到页面
 * @param {Array} activities - 要显示的活动列表
 * @param {string} containerId - HTML 容器的 ID
 */
function renderActivities(activities, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ''; // 清空旧内容

    if (activities.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-gray">暂无活动或正在更新中...</div>`;
        return;
    }

    activities.forEach(activity => {
        const cardHtml = `
            <div class="activity-card mb-3" onclick="handleActivityClick('${activity.deepLink}', '${activity.sourceApp}', \`${activity.specialNote ? activity.specialNote.replace(/'/g, '’') : ''}\`)">
                <div class="activity-icon-container bg-info"><span class="activity-icon">${activity.icon}</span></div>
                <div class="activity-content">
                    <div class="activity-title text-white">${activity.name} (${activity.sourceApp})</div>
                    <div class="activity-desc text-gray">${activity.description}</div>
                </div>
                <i class="fas fa-chevron-right text-white-50"></i>
            </div>
        `;
        container.innerHTML += cardHtml;
    });
}

/**
 * 处理卡片点击事件（Deep Link 和 SpecialNote 弹窗逻辑）
 */
function handleActivityClick(deepLink, sourceApp, specialNote) {
    // 弹窗标题，显示目标 App
    const title = `即将跳转到 [${sourceApp}] App`;
    
    // 如果有特殊说明，先展示特殊说明弹窗
    if (specialNote && specialNote !== 'null') {
        if (confirm(`${title}\n\n🚨 重要使用说明：\n${specialNote}\n\n点击“确定”继续跳转。`)) {
            // 用户点击确认阅读后，执行跳转
            window.location.href = deepLink;
        }
    } else {
        // 没有特殊说明，直接执行跳转前的确认弹窗
        if (confirm(`${title}\n\n请确认该 App 已安装。点击“确定”跳转。`)) {
            window.location.href = deepLink;
        }
    }
}


/**
 * 动态生成 SourceApp 筛选按钮
 */
function renderAppFilters(activities, currentCategory, containerId = 'filter-container', listContainerId = 'activity-list') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 1. 获取所有唯一的 SourceApp 名称
    const uniqueApps = new Set(['全部']);
    activities.forEach(activity => {
        if (activity.sourceApp) {
            uniqueApps.add(activity.sourceApp);
        }
    });

    // 2. 生成按钮 HTML
    container.innerHTML = ''; // 清空旧内容
    uniqueApps.forEach(appName => {
        const isActive = (appName === '全部') ? 'active' : ''; // 默认全部激活
        const buttonHtml = `
            <button class="filter-button btn btn-sm btn-outline-info me-2 mb-2 ${isActive}" data-app="${appName}">
                ${appName}
            </button>
        `;
        container.innerHTML += buttonHtml;
    });

    // 3. 绑定点击事件
    container.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的 active 状态
            container.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            // 添加当前按钮的 active 状态
            this.classList.add('active');

            const selectedApp = this.getAttribute('data-app');
            // 重新渲染列表，进行二级筛选
            const filteredActivities = filterActivities(currentCategory, selectedApp);
            renderActivities(filteredActivities, listContainerId);
        });
    });

    // 默认执行一次筛选，显示全部
    document.querySelector(`#${containerId} .filter-button.active`).click();
}
