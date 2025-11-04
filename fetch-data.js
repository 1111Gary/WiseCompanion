const fs = require('fs');
const path = require('path');
// ⚠️ 导入方式是 CommonJS 风格，适用于 node-fetch 2.x
const fetch = require('node-fetch'); 

// --------------------------------------------------------------------------------
// 核心配置：中文 Airtable 标签与英文 URL Hash 的映射关系
// --------------------------------------------------------------------------------

// 实际 Airtable 中文标签到目标英文标签的映射
// 用于在生成 JSON 文件时将中文标签统一为英文标签。
const CATEGORY_MAP = {
    '签到': 'CheckIn',
    '银行': 'Bank',
    '视频': 'Video',
    '购物': 'Shopping',
    // 如果您的 Airtable 中还有其他标签，请确保在这里添加映射！
};

// --------------------------------------------------------------------------------

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
// ⚠️ 已根据用户提供的 Table ID 更新
const TABLE_NAME = 'tblPWwLrdoMuO1b7k'; 

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
        
        // --- 数据格式化与类别映射：将中文类别转为英文 ---
        const activities = data.records.map(record => {
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
                name: record.fields.Name || '无标题活动',
                description: record.fields.Description || '暂无描述',
                icon: record.fields.Icon || '❓',
                deepLink: record.fields.DeepLink || '#',
                category: category, // **此处已经存储为统一后的英文标签**
                sourceApp: record.fields.SourceApp || '其他',
                specialNote: record.fields.SpecialNote || null,
                targetApp: record.fields.TargetApp || record.fields.SourceApp || '目标 App' 
            };
        });
        
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(activities, null, 2));
        console.log(`数据获取并保存成功：${activities.length} 条记录。类别已映射为英文。`);

    } catch (error) {
        console.error('获取活动数据失败:', error.message);
        // 终止 Actions 流程并报错，以便我们能看到 API 端的 403 错误
        process.exit(1); 
    }
}

fetchData();
