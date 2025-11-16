const fs = require('fs'); 
const path = require('path');
// ... 现有代码 ...
const CATEGORY_MAP = {
// ... 现有代码 ...
};

// --------------------------------------------------------------------------------

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
// ... 现有代码 ...
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'tblPWwLrdoMuO1b7k'; 

const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
// ... 现有代码 ...
async function fetchData() {
// ... 现有代码 ...
        const activities = data.records.map(record => {
// ... 现有代码 ...
            return {
                id: record.id,
// ... 现有代码 ...
                description: record.fields.Description || '暂无描述',
                icon: record.fields.Icon || '❓',
// ... 现有代码 ...
                category: category, 
                sourceApp: record.fields.SourceApp || '其他',
                
                // [【【 核心新增/修正 】】] 
                // 抓取您设置的“抢购提醒”文字
                specialNote: record.fields.SpecialNote || null, 
                
                targetApp: record.fields.TargetApp || record.fields.SourceApp || '目标 App',
                endDate: record.fields.endDate || null,
// ... 现有代码 ...
                StepsText: record.fields.StepsText || null 
            };
        });
        
// ... 现有代码 ...
}

fetchData();
