// fetch-data.js

const fs = require('fs');
const path = require('path');
// ⚠️ 导入方式是 CommonJS 风格，适用于 node-fetch 2.x
const fetch = require('node-fetch'); 

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'Wisecompanion'; // ⚠️ 请务必与您的 Airtable 表名一致

const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
const OUTPUT_FILE = path.join(__dirname, 'activities.json'); 

async function fetchData() {
    console.log(`尝试从 Airtable 加载数据到 ${OUTPUT_FILE}...`);

    try {
        const response = await fetch(AIRTABLE_URL, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_PAT}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            let errorMessage = `Airtable API 错误 (Status: ${response.status})`;
            try {
                const errorData = await response.json();
                errorMessage += `: ${errorData.error.type || response.statusText}`;
            } catch {
                errorMessage += `: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        
        // --- 数据格式化：只保留前端需要的字段 ---
        const activities = data.records.map(record => ({
            id: record.id,
            name: record.fields.Name || '无标题活动',
            description: record.fields.Description || '暂无描述',
            icon: record.fields.Icon || '❓',
            deepLink: record.fields.DeepLink || '#',
            category: Array.isArray(record.fields.Category) ? record.fields.Category : [], 
            sourceApp: record.fields.SourceApp || '其他',
            specialNote: record.fields.SpecialNote || null,
            targetApp: record.fields.TargetApp || record.fields.SourceApp || '目标 App' 
        }));
        
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(activities, null, 2));
        console.log(`数据获取并保存成功：${activities.length} 条记录`);

    } catch (error) {
        console.error('获取活动数据失败:', error.message);
        // 终止 Actions 流程并报错，以便我们能看到 API 端的 403 错误
        process.exit(1); 
    }
}

fetchData();
