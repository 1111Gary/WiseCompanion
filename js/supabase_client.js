// supabase_client.js - 纯净版

const SUPABASE_URL = "https://ymmouqgcprrhhmirhtan.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbW91cWdjcHJyaGhtaXJodGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTQyMzQsImV4cCI6MjA4MDQzMDIzNH0.8NG9FSpDBkulyFU05pRzFf36_i4nl5Bo5hLjaUi75tY"; // ★★★ 请确保这里填入了真实的 Key

// 1. 初始化客户端 (依赖 HTML 中引入的 SDK)
let supabaseClient = null;
if (window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error("❌ Supabase SDK 未加载！请检查 HTML <script> 标签");
}

// 2. 数据格式转换 (Snake_case -> CamelCase)
function toCamel(row) {
    if (!row) return row;
    
    // 【关键修复】前端代码依赖 category.includes()，所以 category 必须是数组
    let catArray = [];
    if (Array.isArray(row.category)) {
        catArray = row.category;
    } else if (typeof row.category === 'string') {
        // 如果数据库存的是 "DailyTask,Deposit"，尝试分割，或者是单字符串转数组
        catArray = row.category.includes(',') ? row.category.split(',') : [row.category];
    }

    return {
        id: row.id.toString(), // 确保 ID 是字符串
        name: row.name,
        description: row.description,
        sourceApp: row.source_app,
        category: catArray, // 修复后的数组
        link: row.link,
        stepsText: row.steps_text,
        specialNote: row.special_note,
        startDate: row.start_date,
        endDate: row.end_date,
        // 其他字段按需保留...
        wechatOnly: row.wechat_only
    };
}

// 3. 本地兜底读取
async function fetchLocal() {
    console.log("🔄 正在切换到本地 activities.json ...");
    try {
        const r = await fetch("./activities.json");
        if (!r.ok) throw new Error("本地文件 404");
        const json = await r.json();
        console.log(`📦 本地数据加载成功：${json.length} 条`);
        return json;
    } catch (err) {
        console.error("❌ 严重错误：本地 activities.json 读取也失败了", err);
        return [];
    }
}

// 4. 定义后端逻辑对象
const NexBackend = {
    activities: {
        async getAll() {
            // 如果 SDK 没加载，直接走本地
            if (!supabaseClient) return await fetchLocal();

            console.log("☁️ 正在尝试连接 Supabase...");
            
            // 尝试查询 Supabase
            const { data, error } = await supabaseClient
                .from("activities")
                .select("*")
                .order("start_date", { ascending: false });

            // 错误处理
            if (error) {
                console.warn("⚠ Supabase 连接报错:", error.message);
                console.warn("👉 可能是表名错误、权限(RLS)未开、或者 Key 不对");
                return await fetchLocal();
            }

            // 空数据处理
            if (!data || data.length === 0) {
                console.warn("⚠ Supabase 连接成功，但没有数据 (空表)");
                return await fetchLocal();
            }

            console.log(`✅ Supabase 加载成功！获取到 ${data.length} 条数据`);
            return data.map(toCamel);
        }
    }
};

// 5. 挂载到全局 window
window.NexBackend = NexBackend;