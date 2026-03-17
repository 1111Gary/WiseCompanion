// ==========================================
// 1. 基础配置
// ==========================================
const SUPABASE_URL = "https://ymmouqgcprrhhmirhtan.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbW91cWdjcHJyaGhtaXJodGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTQyMzQsImV4cCI6MjA4MDQzMDIzNH0.8NG9FSpDBkulyFU05pRzFf36_i4nl5Bo5hLjaUi75tY"; // ⚠️ 请在此填入真实的 Key


// ==========================================
// 2. 模块导入 (注意路径全部指向上一层 ../)
// ==========================================

// 控制器层
import { IdentityManager } from '../controllers/identityManager.js';
import { MembershipManager } from '../controllers/membershipManager.js';
import { LandingController } from '../controllers/landingController.js';
import { ProPlusController } from '../controllers/proPlusController.js';
import { TaskController } from "../controllers/taskController.js";
// 引擎层
import { RenderEngine } from "../engines/renderEngine.js";

import { VoiceEngine } from "../engines/voiceEngine.js";
import ROIEngine from "../engines/roiEngine.js";

// 工具与管理层
import { TimeUtils } from '../utils/timeUtils.js';
import { TacticalManager } from '../controllers/tacticalManager.js'; // 注意：它在 modules/ 下，只需 ../
import { LocalState } from '../services/localState.js';
import { renderTacticalHeader } from '../render/tacticalHeaderRenderer.js';

// 渲染层
import { initPWAUI } from '../render/pwaUI.js';
import { startCountdown } from '../render/countdownRenderer.js';
import { ProPlusRenderer } from '../render/proPlusRenderer.js';
import { NightModeController } from '../controllers/NightModeController.js';

// 纪律引擎 (它在 modules/ 下)
import { runDisciplineEngine } from '../engines/disciplineEngine.js';

// ==========================================
// 3. 全局挂载 (保持原有 HTML onclick 兼容性)
// ==========================================
window.MembershipManager = MembershipManager;
window.TaskController = TaskController;
window.RenderEngine = RenderEngine;
window.IdentityManager = IdentityManager;
window.VoiceEngine = VoiceEngine;
window.ProPlusController = ProPlusController;

// ==========================================
// 4. App 启动逻辑
// ==========================================
export const App = {
    async init() {
        console.log("🚀 系统正在从 modules/app/main.js 启动...");

        // A. 纪律引擎测试
        this.runDisciplineTest();

        // B. 身份验证 (核心：必须最先完成)
        IdentityManager.initClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        await IdentityManager.init();

        // C. 基础 UI 初始化
        initPWAUI();
        LandingController.init();
        LandingController.bindEvents();
        this.syncSystemTimeUI();

        // D. 业务逻辑初始化
        MembershipManager.init();
        ProPlusRenderer.renderStructure();
        ProPlusController.init();

        startCountdown();

        // E. 绑定按钮事件
        this.bindEvents();

        // F. 执行首屏渲染
        RenderEngine.refresh();
    },

    runDisciplineTest() {
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const result = runDisciplineEngine({
            totalFunds: 100000,
            tierAmount: 80000,
            currentAverageBalance:2000,
            currentDay: today.getDate(),
            daysInMonth: daysInMonth
        });
        console.log("🧪 纪律引擎诊断:", result);
    },

    syncSystemTimeUI() {
        // 日期文字
        const d = new Date();
        const dateStr = `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
        const dateEl = document.getElementById('date-text');
        if (dateEl) dateEl.innerText = dateStr;

        // 昼夜模式
        if (typeof NightModeController !== 'undefined') {
            NightModeController.applyNightMode();
        }
    },

    bindEvents() {
        document.getElementById('pro-plus-btn')?.addEventListener('click', () => ProPlusController.openGlobal());
        document.getElementById('pro-plus-close-btn')?.addEventListener('click', () => ProPlusController.close());
    }
};

// 5. 挂载启动
document.addEventListener('DOMContentLoaded', () => {
    App.init();  

    try {
        // 🔴 显式定义 ID，不要直接写变量名
        const SCORE_CONTAINER_ID = 'score-card-wrapper';

        // 获取引擎数据（假设你已经引入了纪律引擎）
        // 这里需要构造输入数据，暂用 window 全局变量或 mock
        const engineInput = {
            totalFunds: window.TOTAL_FUNDS || 1000000,
            tierAmount: 500000,
            currentAverageBalance: window.AVG_BALANCE || 1150000,
            currentDay: new Date().getDate(),
            daysInMonth: new Date(2026, new Date().getMonth() + 1, 0).getDate()
        };

        const engineResult = runDisciplineEngine(engineInput);

        // 调用新渲染器，传入具体的字符串 ID
        renderTacticalHeader(SCORE_CONTAINER_ID, engineResult);

    } catch (error) {
        console.error("❌ 启动渲染时出错:", error);
    }

    if (NightModeController && typeof NightModeController.init === 'function') {
        NightModeController.init();
    } else {
        console.error("NightModeController 加载失败或未定义");
    }
});