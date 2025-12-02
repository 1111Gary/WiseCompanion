const fs = require('fs'); 
const path = require('path');
// 假设使用的是 v2 CJS 版本的 node-fetch
const fetch = require('node-fetch'); 

// --------------------------------------------------------------------------------
// ➡️ 步骤 1：从 config.json 或环境变量加载配置
// --------------------------------------------------------------------------------
const CONFIG_PATH = path.join(__dirname, 'config.json');

let AIRTABLE_PAT = process.env.AIRTABLE_PAT;
let BASE_ID = "appnYFL6PrGonurjT"; 

// 尝试从 config.json 读取配置
try {
    const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);
    
    AIRTABLE_PAT = config.AIRTABLE_PAT || AIRTABLE_PAT;
    BASE_ID = config.AIRTABLE_BASE_ID || BASE_ID;
    
    console.log(`[INFO] 配置已从 config.json 加载。`);
} catch (e) {
    if (e.code === 'ENOENT') {
        console.warn(`[WARN] config.json 文件未找到，尝试使用环境变量。`);
    } else if (e instanceof SyntaxError) {
        console.error(`❌ 错误：config.json 格式错误，请检查 JSON 语法！`);
        process.exit(1);
    } else {
        console.error(`❌ 错误：无法读取 config.json: ${e.message}`);
        process.exit(1);
    }
}
// --------------------------------------------------------------------------------

const TABLE_NAME = 'tblPWwLrdoMuO1b7k'; 

// 分类映射表
const CATEGORY_MAP = {
    // 根分类
    '签到': 'CheckIn',
    '银行': 'Bank',
    '视频': 'Video',
    '购物': 'Shopping',
    
    // --- Bank 子分类 ---
    '日常活动': 'DailyTask',
    '做任务领红包': 'MissionReward',
    '存款理财活动': 'Deposit',

    // --- Shopping 子分类 ---
    '支付有优惠': 'PaymentDiscount',
    '缴费活动': 'Payment',
    '抢红包 / 立减金': 'Voucher',
};

const BASE_AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
const OUTPUT_FILE = path.join(__dirname, 'activities.json'); 

// --------------------------------------------------------------------------------
// 主函数：抓取并写入数据
// --------------------------------------------------------------------------------
async function fetchData() {
    console.log(`尝试从 Airtable 加载数据到 ${OUTPUT_FILE}...`);
    
    // 检查配置是否就绪
    if (!AIRTABLE_PAT || !BASE_ID) {
        console.error('致命错误：缺少 AIRTABLE_PAT 或 BASE_ID 配置！请检查 config.json。');
        process.exit(1);
    }
    
    // PAT 格式基础校验
    if (!AIRTABLE_PAT.startsWith('pat') || AIRTABLE_PAT.length < 50) {
        console.error(`❌ 致命错误：PAT 格式异常！请检查密匙是否完整。`);
        process.exit(1);
    }
    
    // --- 过滤公式：仅获取状态为“活动中”的记录 ---
    const FILTER_FORMULA = `{Status}="活动中"`;
    const ENCODED_FORMULA = encodeURIComponent(FILTER_FORMULA);
    
    const FINAL_AIRTABLE_URL = `${BASE_AIRTABLE_URL}?filterByFormula=${ENCODED_FORMULA}`;
    // ---------------------------------------

    try {
        const response = await fetch(FINAL_AIRTABLE_URL, {
            headers: {
                // 标准模板字符串构建头部，干净简洁
                'Authorization': `Bearer ${AIRTABLE_PAT}`, 
                'Content-Type': 'application/json',
                // 保留 Accept-Encoding 头部，增强网络稳定性
                'Accept-Encoding': 'gzip, deflate, br' 
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable API 错误 (Status: ${response.status})`);
        }

        const data = await response.json();
        
        const activities = data.records
            .filter(record => record.fields && record.fields.Name) 
            .map(record => {
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

            const sourceApp = (record.fields.SourceApp || '其他').trim();

            return {
                id: record.id,
                name: record.fields.Name || '无标题活动',
                description: record.fields.Description || '暂无描述',
                icon: record.fields.Icon || '❓',
                link: record.fields.DeepLink || '#', 
                category: category, 
                sourceApp: sourceApp,
                specialNote: record.fields.SpecialNote || null,
                targetApp: record.fields.TargetApp || sourceApp || '目标 App',
                endDate: record.fields.endDate || null,
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