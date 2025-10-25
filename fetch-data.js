// fetch-data.js

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // 需要在 Actions 中安装

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'Wisecompanion'; // 确保与您的表名一致

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
            const errorData = await response.json();
            throw new Error(`Airtable API 错误 (Status: ${response.status})：${errorData.error.type || response.statusText}`);
        }

        const data = await response.json();
        
        // 格式化数据，只保留前端需要的字段
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
        
        // 将格式化后的数据保存为 JSON 文件
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(activities, null, 2));
        console.log(`数据获取并保存成功：${activities.length} 条记录`);

    } catch (error) {
        console.error('获取活动数据失败:', error.message);
        // 如果获取失败，创建一个空的 JSON 文件，防止部署中断
        fs.writeFileSync(OUTPUT_FILE, '[]');
        process.exit(1); // 终止 Actions 流程并报错
    }
}

fetchData();
