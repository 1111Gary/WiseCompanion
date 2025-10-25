// list.js

// ----------------------------------------------------
// ⚠️ 占位符：将在 GitHub Actions 部署时被您的密钥替换
// ----------------------------------------------------
const AIRTABLE_PAT = '<AIRTABLE_PAT>';
const BASE_ID = '<AIRTABLE_BASE_ID>';
// ----------------------------------------------------

const TABLE_NAME = 'Wisecompanion'; // 确保您的 Airtable 表格名称是 'Activities'

// Airtable API URL
const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

// 存储所有活动数据
let allActivities = [];

/**
 * 核心函数：从 Airtable 加载所有活动数据
 */
async function loadActivities() {
    console.log('尝试连接 Airtable...');
    
    // 检查 PAT/BASE_ID 是否被注入（避免部署失败导致的硬编码暴露）
    if (AIRTABLE_PAT.includes('<') || BASE_ID.includes('<')) {
        console.error('ERROR: Airtable 密钥或 Base ID 未被 GitHub Actions 正确注入。');
        // 在生产环境中不应该弹出警报，但在调试阶段可以保留
        // alert('配置错误：请检查 GitHub Actions Secret 和 YAML 文件。');
        return [];
    }

    try {
        const response = await fetch(AIRTABLE_URL, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_PAT}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Airtable API 错误 (Status: ${response.status})：${errorData.error.type || response.statusText}`);
        }

        const data = await response.json();
        
        // 格式化数据，只保留我们需要的字段
        allActivities = data.records.map(record => ({
            id: record.id,
            name: record.fields.Name || '无标题活动',
            description: record.fields.Description || '暂无描述',
            icon: record.fields.Icon || '❓',
            deepLink: record.fields.DeepLink || '#',
            // Category 字段必须是数组
            category: Array.isArray(record.fields.Category) ? record.fields.Category : [], 
            sourceApp: record.fields.SourceApp || '其他',
            specialNote: record.fields.SpecialNote || null,
            // 使用 SourceApp 作为 TargetApp 的回退值
            targetApp: record.fields.TargetApp || record.fields.SourceApp || '目标 App' 
        }));
        
        console.log('活动数据加载成功:', allActivities.length, '条记录');
        return allActivities;

    } catch (error) {
        console.error('加载活动数据失败:', error);
        // 弹出用户看到的错误提示
        alert('活动数据加载失败，请检查 Airtable 密钥、Base ID 或网络连接。');
        return [];
    }
}

/**
 * 过滤函数：根据页面需求过滤活动
 */
function filterActivities(requiredCategory, filterApp = null) {
    let filteredList = allActivities.filter(activity => 
        // 检查 Category 字段是否包含必需的标签
        activity.category.includes(requiredCategory)
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
 */
function renderActivities(activities, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ''; // 清空旧内容

    if (activities.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-gray">当前筛选条件下暂无活动。</div>`;
        return;
    }

    activities.forEach(activity => {
        // 使用 TargetApp 字段或 SourceApp 字段作为显示的 App 名称
        const displayApp = activity.targetApp || activity.sourceApp;

        // data-note 属性用于存储 SpecialNote，方便在点击时读取
        const cardHtml = `
            <a href="#" class="activity-card mb-3" 
               onclick="handleActivityClick(event, '${activity.deepLink}', '${displayApp}', \`${activity.specialNote ? activity.specialNote.replace(/`/g, '\\`').replace(/'/g, '’') : ''}\`)"
               >
                <div class="activity-icon-container bg-info"><span class="activity-icon">${activity.icon}</span></div>
                <div class="activity-content">
                    <div class="activity-title text-white">${activity.name} (${displayApp})</div>
                    <div class="activity-desc text-gray">${activity.description}</div>
                </div>
                <i class="fas fa-chevron-right text-white-50"></i>
            </a>
        `;
        container.innerHTML += cardHtml;
    });
}

/**
 * 处理卡片点击事件（Deep Link 和 SpecialNote 弹窗逻辑）
 */
function handleActivityClick(event, deepLink, sourceApp, specialNote) {
    event.preventDefault(); // 阻止 <a> 标签默认跳转
    
    // 弹窗标题
    const title = `即将跳转到 [${sourceApp}] App`;
    
    // 移除转义字符，恢复原始的 SpecialNote
    const cleanedNote = specialNote.replace(/\\`/g, '`');

    // 如果有特殊说明，先展示特殊说明弹窗
    if (cleanedNote && cleanedNote !== 'null' && cleanedNote.trim() !== '') {
        if (confirm(`${title}\n\n🚨 重要使用说明：\n\n${cleanedNote}\n\n点击“确定”继续跳转。`)) {
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
    
    // 如果只有一个 '全部' 按钮，且不是银行页面，则不渲染筛选器
    if (uniqueApps.size <= 1 && currentCategory !== '银行') {
        // 不渲染筛选器，但确保主列表被渲染 (筛选器会调用 renderActivities，这里不做重复调用)
        return; 
    }

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
    setTimeout(() => {
        const defaultButton = document.querySelector(`#${containerId} .filter-button.active`);
        if (defaultButton) {
            defaultButton.click();
        } else {
            // 如果没有筛选按钮（例如 uniqueApps.size <= 1），确保主列表被渲染
            renderActivities(filterActivities(currentCategory), listContainerId);
        }
    }, 0);
}
