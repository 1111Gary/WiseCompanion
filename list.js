// list.js

// ----------------------------------------------------
// ⚠️ 移除所有 Airtable Secret 占位符和变量，它们不再需要！
// ----------------------------------------------------

// 存储所有活动数据
let allActivities = [];

/**
 * 核心函数：从 本地 activities.json 文件加载所有活动数据
 */
async function loadActivities() {
    console.log('尝试加载本地活动数据...');
    
    try {
        // 尝试从部署的静态文件加载数据
        // 🚨 路径 /activities.json 是指向根目录下的文件
        const response = await fetch('/activities.json'); 
        
        if (!response.ok) {
            // 如果文件不存在或加载失败（404），可能是部署失败
            throw new Error(`无法加载 activities.json 文件 (Status: ${response.status})`);
        }

        // 直接获取 JSON 数据
        allActivities = await response.json();
        
        console.log('活动数据加载成功:', allActivities.length, '条记录');
        return allActivities;

    } catch (error) {
        console.error('加载活动数据失败:', error);
        // 弹出用户看到的错误提示
        alert('活动数据加载失败，请检查部署是否成功或联系管理员。');
        return [];
    }
}

// ... 假设后面的 filterActivities, renderActivities 等函数保持不变
// 请确保您的 filterActivities, renderActivities 仍然使用 allActivities 变量
// loadActivities().then(() => {
//     filterActivities();
//     renderActivities(allActivities);
// });
