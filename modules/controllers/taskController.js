//modules\controllers\taskController.js
import { TaskService } from "../services/taskService.js";
import { TaskGuideUI } from "../ui/taskGuideUI.js";

export const TaskController = {

    refresh() {
        if (window.RenderEngine && typeof window.RenderEngine.refresh === 'function') {
            window.RenderEngine.refresh();
        } else {
            console.warn("RenderEngine not found, falling back to reload.");
            window.location.reload();
        }
    },

    // 启动新任务
    start(id, link) {
        const t = window.ALL_TASKS?.find(x => x.id == id);
        if (!t) return;

        if (window.LocalState) window.LocalState.addToOngoing(id);

        if (link && link.length > 5) {
            this._handleLinkOpen(link);
        } else {
            if (window.VoiceEngine)
                window.VoiceEngine.play(window.AGENT_INTRO_VOICE);

            this.openGuide(t);

            // ✅ 这里可以 refresh，因为 start 会改变状态
            this.refresh();
        }
    },

    // 继续任务（❗不刷新）
    continueTask(id) {
        const t = window.ALL_TASKS?.find(x => x.id == id);
        if (!t) return;
        // 外链任务
        if (t.link && t.link.length > 5) {
            this._handleLinkOpen(t.link);
            return;
        }

        // 继续任务只打开 UI，不刷新
        this.openGuide(t);
    },

    _handleLinkOpen(link) {
        if (window.isWeChat) {
            sessionStorage.setItem('need_refresh_after_task', '1');
        }

        window.open(link, '_blank');

        if (!window.isWeChat) {
            this.refresh();
        }
    },

    async complete(id) {
        if (!window.USER_ID) return;

        try {
            const task = window.ALL_TASKS.find(x => x.id == id);
            if (!task) return;

            await TaskService.syncComplete(task);

            if (window.LocalState)
                window.LocalState.removeFromOngoing(id);

            if (window.TacticalManager)
                window.TacticalManager.applyExecution(task);

            await this.refresh();

        } catch (e) {
            console.error("Task completion failed:", e);
        }
    },
    async skipToday(id) {
        if (!window.USER_ID) return;

        try {
            await TaskService.syncSkip(id);

            if (window.LocalState)
                window.LocalState.removeFromOngoing(id);

            await this.refresh();

        } catch (e) {
            console.error("Skip failed:", e);
        }

        if (this._skipLock) return;
        this._skipLock = true;
        try {
            await TaskService.syncSkip(id);
            await this.refresh();
        } finally {
            this._skipLock = false;
        }
    },



    async handleTierClick(taskId, tierAmount) {
        const task = (window.ALL_TASKS || []).find(t => t.id === taskId);
        const { data: dbLocks } = await window.sbClient.from('capital_ledger').select('*').eq('status', 'active');
        if (!task) return;

        // 1. 获取基础数据
        const totalCap = window.USER_PROFILE?.total_capital || 350000;
        const now = new Date();
        const today = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const remainingDays = daysInMonth - today + 1;

        // 借用 Controller 的逻辑算一下当前锁定
        const currentLocked = ProPlusController.calculateLocked(dbLocks);
        const risk = RiskEngine.evaluateStatus(totalCap, currentLocked);

        // 🔴 红色拦截逻辑
        if (!risk.canAction) {
            alert(`【精算师紧急拦截】\n\n${risk.label}\n${risk.desc}\n\n请先撤销其他银行的无效战术目标！`);
            return; // 直接退出，不执行任何模拟和写入
        }

        // 🟡 黄色提醒逻辑
        if (risk.level === 'CAUTION') {
            console.warn("当前处于警戒水位，操作需谨慎。");
        }

        // 2. 模拟月均 (SSI) 达成
        // 积分 = 历史真实积分(DisciplineEngine提供) + (当前存量 + 本次新增) * 剩余天数
        const historyPoints = await DisciplineEngine.getRealAccumulatedPoints();
        const currentTotalBalance = totalCap; // 假设你的本金是满额投入
        const projectedPoints = historyPoints + (currentTotalBalance + tierAmount) * remainingDays;
        const projectedAvg = projectedPoints / daysInMonth;

        // 目标月均线 (以点击的档位为准)
        const targetLine = tierAmount;
        const isSuccess = projectedAvg >= targetLine;

        // 3. 构建精算师的结论 (这是为了建立信赖感)
        let message = "";
        if (isSuccess) {
            message = `✅ 精算通过：由于今日介入，本月均值预计可达 ￥${Math.floor(projectedAvg).toLocaleString()}，稳超 ${targetLine / 10000}万 门槛。`;
        } else {
            const gap = (targetLine * daysInMonth) - projectedPoints;
            const dailyRefill = Math.ceil(gap / remainingDays);
            message = `⚠️ 预判告警：由于本月前期余额较低，即便现在锁仓 ${tierAmount / 10000}万，月终均值也仅为 ￥${Math.floor(projectedAvg).toLocaleString()}。\n\n建议：除此操作外，今日需额外补位 ￥${dailyRefill.toLocaleString()} 活期头寸方可达标。`;
        }

        // 4. 用户确认后才执行原本的 activateTacticalX 写入逻辑
        if (confirm(`【精算预判结论】\n\n${message}\n\n确认部署该战术吗？`)) {
            // 执行真正的写入数据库逻辑
            await this.executeDatabaseLock(task, tierAmount);
        }
    },

    async executeDatabaseLock(task, tierAmount) {
        try {
            const task = window.ALL_TASKS?.find(x => x.id == id);
            const totalCap = window.USER_PROFILE?.total_capital || 350000;

            // 1. 获取当前已锁定的总额（排除当前任务，因为是 upsert）
            const { data: currentLocks } = await window.sbClient
                .from('capital_ledger')
                .select('*')
                .eq('source_app', task.source_app)
                .eq('status', 'active');

            // 计算如果不点这个按钮，其他银行已经占用了多少钱
            const bankMax = {};
            currentLocks.forEach(l => {
                if (l.task_id === id) return; // 排除掉自己当前的任务
                const bank = l.source_app || 'Generic';
                bankMax[bank] = Math.max(bankMax[bank] || 0, Number(l.capital_locked));
            });

            const otherLocked = Object.values(bankMax).reduce((a, b) => a + b, 0);

            // 计算如果点了这个按钮，该银行的真实占用（取现有最大值和新挡位的较大者）
            const currentBankMax = bankMax[task.source_app] || 0;
            const newBankMax = Math.max(currentBankMax, tier);

            const projectedTotalLocked = otherLocked + newBankMax;

            // 🔴 防火墙逻辑
            if (projectedTotalLocked > totalCap) {
                alert(`❌ 精算驳回：此操作将导致总锁仓 (${projectedTotalLocked}) 超过总本金 (${totalCap})！\n请先撤销其他银行的战术目标。`);
                return;
            }

            // 2. 校验通过，执行写入
            await TaskService.syncToLedger(task, tier);
            // ... 后续刷新逻辑
        } catch (e) { console.error(e); }
    },

    openVideo(link) {
        if (link) window.open(link, '_blank');
    },

    openGuide(t, mode = 'normal') {
        if (TaskGuideUI && typeof TaskGuideUI.render === 'function') {
            TaskGuideUI.render(t, mode);
        }
    },

    closeGuide() {
        if (TaskGuideUI && typeof TaskGuideUI.close === 'function') {
            TaskGuideUI.close();
        }
    }
};

window.TaskController = TaskController;