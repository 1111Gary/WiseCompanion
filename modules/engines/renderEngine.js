//modules\engines\renderEngine.js
import { TaskDataService } from '../services/taskDataService.js';
import { TaskProcessor } from './taskProcessor.js';
import { TaskCardRenderer } from '../render/taskCardRenderer.js';
import { GreetingEngine } from './greetingEngine.js';
import { NightModeController } from '../controllers/NightModeController.js'; // ✅ 新的
import { VideoEngine } from './videoEngine.js';
import { buildRecommendWithRadar } from './recommendEngineAdapter.js';
import { applyVideoEmotionUI, toggleVideoSection } from '../render/videoUI.js';
import { TimeUtils } from '../utils/timeUtils.js';

import { renderTacticalHeader } from '../render/tacticalHeaderRenderer.js';
import { runDisciplineEngine } from './disciplineEngine.js';
import { StrategyEngine } from "./strategyEngine.js";
export const RenderEngine = {
    async refresh() {
        const userId = window.USER_ID;
        if (!userId) return;

        try {
            const CURRENT_DATE_KEY = TimeUtils.getLocalDateKey();
            const data = await TaskDataService.fetchAll(userId, CURRENT_DATE_KEY);
            window.USER_STATUSES = data.statuses;

            // 1. 同步战术输入数据
            window.CURRENT_TACTICAL_INPUT = {
                totalFunds: data.statuses?.totalAssets || 0,
                tierAmount: data.statuses?.targetTier || 500000,
                currentAverageBalance: data.statuses?.avgBalance || 0,
                currentDay: new Date().getDate(),
                daysInMonth: new Date(2026, new Date().getMonth() + 1, 0).getDate()
            };

            // 2. 运行纪律引擎
            const discipline = runDisciplineEngine(window.CURRENT_TACTICAL_INPUT);

            // 3. 【核心】保留状态流转逻辑：区分 ongoing 和 recommend
            const ongoingIds = window.LocalState?.getOngoingIds() || [];

            // 这里必须保留 TaskProcessor.decorate，否则卡片不知道自己是不是正在进行中
            window.ALL_TASKS = data.tasks.map(t =>
                TaskProcessor.decorate(t, data.statuses, data.skippedIds, ongoingIds, window.ALL_TASKS)
            );

            const groups = { videos: [], ongoing: [], recommend: [] };
            window.ALL_TASKS.forEach(t => {
                if (t.isCompleted || t.isSkipped) return;

                if (t.agent_open_mode === 'video') {
                    groups.videos.push(t);
                } else if (t.isOngoing) {
                    // ✅ 关键：正在进行的卡片不能被过滤，否则用户正在做的任务会消失
                    groups.ongoing.push(t);
                } else {
                    // ✅ 待推荐的活动，存入 recommend 桶
                    groups.recommend.push(t);
                }
            });

            // 4. 渲染战术头部
            renderTacticalHeader('score-card-wrapper', discipline);

            // 5. 【策略介入】仅对“推荐区”进行策略过滤
            // 这样既保证了进行中的任务不丢，又保证了推荐的活动是符合当前资产压力的
            const tacticalRecommend = StrategyEngine.filter(groups.recommend, discipline);

            // 6. 渲染 UI
            TaskCardRenderer.renderList('ongoing', groups.ongoing);
            TaskCardRenderer.renderList('video', VideoEngine.getRotatedVideos(groups.videos, 5));
            // 这里我们使用经过 StrategyEngine 过滤后的结果
            TaskCardRenderer.renderList('recommend', tacticalRecommend.slice(0, 3));

            this.handleExtraUI(groups);
            console.log("✅ 逻辑修复完成：卡片流转正常，策略已加载");
        } catch (err) {
            console.error("❌ 渲染刷新失败:", err);
        }

    },

    _getLatestEngineData() {
        // 1. 尝试从全局变量获取输入
        let input = window.CURRENT_TACTICAL_INPUT;

        // 2. 🔴 严密逻辑修复：如果全局变量没准备好，构造一个基础输入防止崩溃
        if (!input) {
            console.warn("⚠️ 战术输入数据未就绪，尝试从 LocalState 恢复...");

            // 这里根据你的实际逻辑调整，或者给一个空值检查逻辑
            input = {
                totalFunds: 0,
                tierAmount: 500000, // 默认升金档位
                currentAverageBalance: 0,
                currentDay: new Date().getDate(),
                daysInMonth: new Date(2026, new Date().getMonth() + 1, 0).getDate()
            };
        }

        // 3. 只有 input 确定存在时才运行引擎
        return runDisciplineEngine(input);
    },
    handleExtraUI(groups) {
        const visitKey = 'nex_has_visited_app';
        const isFirstVisit = !localStorage.getItem(visitKey);
        if (isFirstVisit) localStorage.setItem(visitKey, '1');

        const greetingData = GreetingEngine.generate({
            isFirstVisit,
            ongoingCount: groups.ongoing.length,
            recommendCount: groups.recommend.length
        });

        const gEl = document.getElementById('greeting-text');
        if (gEl) gEl.innerText = greetingData.text;

        NightModeController.applyNightMode();
        applyVideoEmotionUI(VideoEngine.getEmotionalTimeState());
        this.tryPlayGreeting(greetingData.text);
        window.toggleVideoSection = toggleVideoSection;
    },

    tryPlayGreeting(text) {
        const today = new Date().toISOString().slice(0, 10);
        const greetPlayedKey = `greet_played_${today}`;
        const isLandingShowing = window.LandingController?.isShowing() || false;
        if (!localStorage.getItem(greetPlayedKey) && text && !isLandingShowing) {
            if (window.VoiceEngine) window.VoiceEngine.play(text);
            localStorage.setItem(greetPlayedKey, "1");
        }
    }
};