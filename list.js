// list.js

// ----------------------------------------------------
// ⚠️ 确保移除了所有 AIRTABLE_PAT 和 BASE_ID 变量
// ----------------------------------------------------

let allActivities = [];

/**
 * 核心函数：从 本地 activities.json 文件加载所有活动数据
 */
async function loadActivities() {
    console.log('尝试加载本地活动数据...');
    
    try {
        // 尝试从部署的静态文件加载数据
        const response = await fetch('/activities.json'); 
        
        if (!response.ok) {
            throw new Error(`无法加载 activities.json 文件 (Status: ${response.status})`);
        }

        allActivities = await response.json();
        
        console.log('活动数据加载成功:', allActivities.length, '条记录');
        return allActivities;

    } catch (error) {
        console.error('加载活动数据失败:', error);
        alert('活动数据加载失败，请检查部署是否成功或联系管理员。');
        return [];
    }
}

// ... 保持其他函数不变
