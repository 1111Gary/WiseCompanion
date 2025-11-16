const fs = require('fs'); 
const path = require('path');
// 假设使用的是 v2 CJS 版本的 node-fetch
const fetch = require('node-fetch'); 

// --------------------------------------------------------------------------------
// 核心配置：中文 Airtable 标签与英文 URL Hash 的映射关系
// --------------------------------------------------------------------------------
const CATEGORY_MAP = {
    // 根分类
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
// Airtable 配置 (从环境变量读取)
// --------------------------------------------------------------------------------
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID; // 修正：确保已定义
const TABLE_NAME = 'tblPWwLrdoMuO1b7k'; 

const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
const OUTPUT_FILE = path.join(__dirname, 'activities.json'); 

// --------------------------------------------------------------------------------
// 主函数：抓取并写入数据
// --------------------------------------------------------------------------------
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

        // [【【 核心修正 】】]
        // 这一行必须存在！它解析来自 Airtable 的 JSON 数据。
        // `data` 变量在这一行被定义。
        const data = await response.json();
        
        // 这一行 (原 line 19) 现在可以安全地使用 'data' 变量了
        const activities = data.records.map(record => {
            let category = [];
            const rawCategories = record.fields.Category;

            // 处理分类映射
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

            // 构造最终的对象
            return {
                id: record.id,
                name: record.fields.Name || '无标题活动',
                description: record.fields.Description || '暂无描述',
                icon: record.fields.Icon || '❓',
                link: record.fields.DeepLink || '#', 
                category: category, 
                sourceApp: record.fields.SourceApp || '其他',
                specialNote: record.fields.SpecialNote || null, // 抢购提醒
                targetApp: record.fields.TargetApp || record.fields.SourceApp || '目标 App',
                endDate: record.fields.endDate || null,
                StepsText: record.fields.StepsText || null // 语音引导
            };
        });
        
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(activities, null, 2));
        console.log(`数据获取并保存成功：${activities.length} 条记录。`);

    } catch (error) {
        console.error('获取活动数据失败:', error.message);
        process.exit(1); 
    }
}

// --------------------------------------------------------------------------------
// 执行
// --------------------------------------------------------------------------------
fetchData();
