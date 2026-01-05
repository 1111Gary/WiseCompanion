// supabase_client.js - 纯净版

const SUPABASE_URL = "https://ymmouqgcprrhhmirhtan.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbW91cWdjcHJyaGhtaXJodGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTQyMzQsImV4cCI6MjA4MDQzMDIzNH0.8NG9FSpDBkulyFU05pRzFf36_i4nl5Bo5hLjaUi75tY"; // ★★★ 请确保这里填入了真实的 Key

// =======================
// NexBackend.tasks 版本
// =======================
// 初始化 Supabase 客户端
if (window.supabase && window.supabase.createClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error("❌ Supabase SDK 未加载！");
}
const NexBackend = {
    tasks: {
        async getAll() {
            // SDK 未加载，直接尝试读取本地 fallback
            if (!supabaseClient) {
                console.warn("❌ Supabase SDK 未加载，使用本地 tasks.json 兜底");
                return fetchLocalTasks();
            }

            console.log("☁️ 正在尝试连接 Supabase tasks 表...");

            // 查询 Supabase tasks 表
            const { data, error } = await await window.supabaseClient
                .from("tasks")
                .select("*")
                .order("valid_from", { ascending: false });

            if (error) {
                console.error("⚠ Supabase 查询 tasks 出错:", error.message);
                return fetchLocalTasks();
            }

            if (!data || data.length === 0) {
                console.warn("⚠ Supabase tasks 表为空，使用本地 fallback");
                return fetchLocalTasks();
            }

            // 数据字段映射
            const mapped = data.map(row => {
                let catArray = [];
                if (Array.isArray(row.category)) {
                    catArray = row.category;
                } else if (typeof row.category === "string") {
                    catArray = row.category.includes(",") ? row.category.split(",") : [row.category];
                }

                return {
                    id: row.id.toString(),
                    title: row.title,
                    sourceApp: row.source_app,
                    category: catArray,
                    subCategory: row.sub_category,
                    deepLink: row.deep_link,
                    voiceSteps: row.voice_steps,
                    validFrom: row.valid_from,
                    validTo: row.valid_to,
                    estimatedTime: row.estimated_time,
                    isHighValue: row.is_high_value,
                    freshnessWeight: row.freshness_weight,
                    successProbability: row.success_probability,
                    urgency: row.urgency,
                    agentBaseScore: row.agent_base_score,
                    taskType: row.task_type,
                    resetRule: row.reset_rule,
                    isStickyOnceStarted: row.is_sticky_once_started,
                    recommendable: row.recommendable,
                    isActiveNow: row.is_active_now,
                    agent0Block: row.agent0_block,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                };
            });

            console.log(`✅ Supabase tasks 加载成功！共 ${mapped.length} 条`);
            return mapped;
        }
    }
};

// =======================
// 本地 fallback 读取函数
// =======================
async function fetchLocalTasks() {
    console.log("🔄 正在读取本地 tasks.json 兜底...");
    try {
        const r = await fetch("./tasks.json");
        if (!r.ok) throw new Error("本地文件 404");
        const json = await r.json();

        // 简单字段映射保持和 Supabase 一致
        const mapped = json.map(row => {
            let catArray = [];
            if (Array.isArray(row.category)) {
                catArray = row.category;
            } else if (typeof row.category === "string") {
                catArray = row.category.includes(",") ? row.category.split(",") : [row.category];
            }
            return {
                id: row.id.toString(),
                title: row.title,
                sourceApp: row.sourceApp || row.source_app,
                category: catArray,
                subCategory: row.subCategory || row.sub_category,
                deepLink: row.deepLink || row.deep_link,
                voiceSteps: row.voiceSteps || row.voice_steps,
                validFrom: row.validFrom || row.valid_from,
                validTo: row.validTo || row.valid_to,
                estimatedTime: row.estimatedTime || row.estimated_time,
                isHighValue: row.isHighValue || row.is_high_value,
                freshnessWeight: row.freshnessWeight || row.freshness_weight,
                successProbability: row.successProbability || row.success_probability,
                urgency: row.urgency,
                agentBaseScore: row.agentBaseScore || row.agent_base_score,
                taskType: row.taskType || row.task_type,
                resetRule: row.resetRule || row.reset_rule,
                isStickyOnceStarted: row.isStickyOnceStarted || row.is_sticky_once_started,
                recommendable: row.recommendable,
                isActiveNow: row.isActiveNow,
                agent0Block: row.agent0Block || row.agent0_block,
                createdAt: row.createdAt || row.created_at,
                updatedAt: row.updatedAt || row.updated_at
            };
        });

        console.log(`📦 本地 tasks.json 加载成功，共 ${mapped.length} 条`);
        return mapped;
    } catch (err) {
        console.error("❌ 严重错误：本地 tasks.json 读取失败", err);
        return [];
    }
}

// 挂载到全局 window
window.NexBackend = NexBackend;
