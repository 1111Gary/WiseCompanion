const fs = require('fs'); 
const path = require('path');
const fetch = require('node-fetch'); 

// --------------------------------------------------------------------------------
// 核心配置：中文 Airtable 标签与英文 URL Hash 的映射关系
// --------------------------------------------------------------------------------
const CATEGORY_MAP = {
    '签到': 'CheckIn',
    '银行': 'Bank',
    '视频': 'Video',
    '购物': 'Shopping',
    
    // --- Bank 子分类 ---
    '日常活动': 'DailyTask',
    '缴费活动': 'Payment',
    '存款理财活动': 'Deposit',

    // --- Shopping 子分类 ---
    '支付有优惠': 'PaymentDiscount',
    '抢红包 / 立减金': 'Voucher',
    '做任务领红包': 'MissionReward',
};

// --------------------------------------------------------------------------------

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
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
            throw new Error(`Airtable API 错误 (Status: ${response.status})`);
        }

        const data = await response.json();
        
        const activities = data.records.map(record => {
            let category = [];
            const rawCategories = record.fields.Category;

            if (Array.isArray(rawCategories)) {
                category = rawCategories
                    .map(c => CATEGORY_MAP[c.trim()] || c.trim()) 
                    .filter(c => c); 
            } else if (rawCategories) {
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
                link: record.fields.DeepLink || '#', 
                category: category, 
                sourceApp: record.fields.SourceApp || '其他',
                specialNote: record.fields.SpecialNote || null,
                targetApp: record.fields.TargetApp || record.fields.SourceApp || '目标 App',
                endDate: record.fields.endDate || null,
                
                // [【【 核心新增 】】] 
                // 抓取步骤文字，供 Web Speech API (原生语音) 使用
                StepsText: record.fields.StepsText || null 
            };
        });
        
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(activities, null, 2));
        console.log(`数据获取并保存成功：${activities.length} 条记录。`);

    } catch (error) {
        console.error('获取活动数据失败:', error.message);
        process.exit(1); 
    }
}

fetchData();
