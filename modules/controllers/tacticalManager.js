// modules/tacticalManager.js
import { TacticalEngine } from '../engines/tacticalEngine.js';

export const TacticalManager = {
    KEY: 'NEX_AI_TACTICAL_PROFILE',
    SUPPORTED_BANKS: ['icbc', 'ccb', 'boc', 'abc', 'bocom'],
    get() {
        const raw = localStorage.getItem(this.KEY);
        // 1. 先完整定义默认值对象
        const defaultData = {
            total: 350000,
            lastMonthAverages: {
                A: { icbc: 9000, ccb: 2600, bocom: 500, boc: 500, abc: 500 },
                B: { icbc: 76000, ccb: 7600, bocom: 500, boc: 500, abc: 500 }
            },
            A: { icbc: 0, ccb: 0, boc: 0, abc: 0, bocom: 0 },
            B: { icbc: 0, ccb: 0, boc: 0, abc: 0, bocom: 0 },
            balances: { free: 350000 },
            locked: [],
            ts: '--',
            average: 0
        };

        // 2. 如果没数据返回默认，有数据则进行合并
        if (!raw) return defaultData;

        try {
            const parsed = JSON.parse(raw);
            return { ...defaultData, ...parsed };
        } catch (e) {
            return defaultData;
        }
    },
    save(data) {
        data.ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        const raw = JSON.stringify(data);
        localStorage.setItem(this.KEY, raw);

        // 🔴 关键修复：同步到全局变量，防止 Controller 读不到
        window.USER_PROFILE = data;

        // 🔴 关键修复：如果当前有 Controller，立即命令它刷新
        if (window.ProPlusController && window.ProPlusController.refresh) {
            window.ProPlusController.refresh();
        }
    },
    // 银行名称标准化
    normalizeBankName(name = '') {
        const n = name.toLowerCase();
        if (n.includes('工商') || n.includes('icbc')) return 'icbc';
        if (n.includes('建设') || n.includes('ccb')) return 'ccb';
        if (n.includes('农业') || n.includes('abc')) return 'abc';
        if (n.includes('中国银行') || n.includes('boc')) return 'boc';
        if (n.includes('交通') || n.includes('bocom')) return 'bocom';
        return 'other';
    },

    // 🔴 核心修改：执行任务不再扣基准，而是扣可用余额并记入锁定
    applyExecution(task) {
        if (!task) return;
        const profile = this.get();
        const advice = TacticalEngine.evaluate(task, profile, window.USER_STATUSES || []);

        if (advice.skip) return;

        const amount = Number(task.agent_capital_threshold || 0);
        if (amount > 0) {
            // 检查余额是否够用
            if (profile.balances.free < amount) {
                if (window.UIUtils) window.UIUtils.toast('战术预警: 自由资金不足');
                return;
            }

            const exec = advice.executor || 'A';
            const bankKey = this.normalizeBankName(task.source_app);
            const holdingDays = Number(task.t_plus_n || 0);
            const release = new Date();
            release.setDate(release.getDate() + holdingDays);

            // 1. 扣除实时可用总额
            profile.balances.free -= amount;
            profile.total -= amount;

            // 2. 记入锁定队列
            profile.locked.push({
                task_id: task.id,
                bank: bankKey,
                account: exec, // 记录是 A 还是 B 在做
                amount: amount,
                lock_mode: task.lock_mode || 'SHARED', // 这里的 lock_mode 来自 OpportunityEngine
                release_date: release.toISOString().slice(0, 10)
            });
            this.save(profile);

            profile.ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
            localStorage.setItem(this.KEY, JSON.stringify(profile));

            if (window.UIUtils) window.UIUtils.toast(`战术执行: ${exec}账户锁定 ${amount}元`);

            // 🔴 触发全局刷新：日历和列表会即时重绘
            if (window.RenderEngine) window.RenderEngine.refresh();
            // 如果是在 ProPlus 界面，触发一次增量渲染
            if (window.ProPlusController) window.ProPlusController.init(window.ALL_TASKS, window.USER_STATUSES);
        }
    },

    // 🔴 2. 跨月自动校准
    autoCalibrate(profile) {
        const now = new Date();
        const currentMonth = now.getMonth();

        if (profile.lastMonth !== undefined && profile.lastMonth !== currentMonth) {
            // 自动将上月锁定的任务按 50% 权重（示例）转为本月起始基准
            this.SUPPORTED_BANKS.forEach(bank => {
                const contributionA = profile.locked
                    .filter(l => l.bank === bank && l.account === 'A')
                    .reduce((sum, t) => sum + t.amount * 0.5, 0);
                profile.A[bank] = (profile.A[bank] || 0) + contributionA;
            });
            if (window.UIUtils) window.UIUtils.toast("跨月基准已自动演进");
        }
        profile.lastMonth = currentMonth;
        return profile;
    },


    // 🔴 3. 多银行 UI 动态渲染 (融合你提供的逻辑)
    populateUI(data) {
        // 1. 填充总额和时间（这些是固定的，不需要重绘）
        const totalInput = document.getElementById('pp-local-total');
        if (totalInput) totalInput.value = data.total || 0;

        const tsEl = document.getElementById('pp-last-sync');
        if (tsEl) tsEl.innerText = data.ts || '--:--';

        // 2. 核心：填充 A/B 账户各行数据
        this.SUPPORTED_BANKS.forEach(bank => {
            // 填充实时余额 (3月)
            const inputA = document.getElementById(`pp-base-a-${bank}`);
            const inputB = document.getElementById(`pp-base-b-${bank}`);
            if (inputA) inputA.value = data.A?.[bank] || 0;
            if (inputB) inputB.value = data.B?.[bank] || 0;

            // 填充结转底色 (2月)
            const lastA = document.getElementById(`pp-last-a-${bank}`);
            const lastB = document.getElementById(`pp-last-b-${bank}`);
            if (lastA) lastA.value = data.lastMonthAverages?.A?.[bank] || 0;
            if (lastB) lastB.value = data.lastMonthAverages?.B?.[bank] || 0;
        });

        // 3. 🔴 重新绑定开关逻辑（解决点击不出来的问题）
        // 因为 populateUI 可能在 DOM 刚生成后调用，我们要确保事件接管
        this._bindInternalUIEvents();
    },

    _bindInternalUIEvents() {
        const toggleBtn = document.getElementById('pp-toggle-config');
        const drawer = document.getElementById('pp-config-drawer');

        if (toggleBtn && drawer) {
            // 先移除旧事件防止重复绑定
            toggleBtn.onclick = null;
            toggleBtn.onclick = (e) => {
                e.preventDefault();
                const isHidden = drawer.style.display === 'none';
                drawer.style.display = isHidden ? 'block' : 'none';
                toggleBtn.innerText = isHidden ? '收起细节配置 ↑' : '展开细节配置 ↓';
            };
        }

        const syncBtn = document.getElementById('pp-sync-trigger');
        if (syncBtn) {
            syncBtn.onclick = () => this.sync();
        }
    },
    // 🔴 4. 同步保存逻辑 (融合你提供的逻辑)
    sync() {
        const data = this.get();
        if (!data.lastMonthAverages) data.lastMonthAverages = { A: {}, B: {} };

        let totalCurrent = 0;

        this.SUPPORTED_BANKS.forEach(bank => {
            const valA = Number(document.getElementById(`pp-base-a-${bank}`)?.value || 0);
            const valB = Number(document.getElementById(`pp-base-b-${bank}`)?.value || 0);
            const lastA = Number(document.getElementById(`pp-last-a-${bank}`)?.value || 0);
            const lastB = Number(document.getElementById(`pp-last-b-${bank}`)?.value || 0);

            data.A[bank] = valA;
            data.B[bank] = valB;
            data.lastMonthAverages.A[bank] = lastA;
            data.lastMonthAverages.B[bank] = lastB;

            totalCurrent += (valA + valB);
        });

        data.total = Number(document.getElementById('pp-local-total')?.value || 0);
        data.average = totalCurrent; // 这里可以改为更复杂的权重计算

        this.save(data); // 🔴 现在 save 存在了，不会报错

        // 视觉反馈逻辑...
        this._updateSyncUI(data.ts);
        if (window.ProPlusController) window.ProPlusController.init();
    },

    _updateSyncUI(ts) {
        const btn = document.getElementById('pp-sync-trigger');
        if (btn) {
            btn.innerText = "✓ 同步成功";
            btn.style.background = "#52c41a";
            setTimeout(() => {
                btn.innerText = "同步画像";
                btn.style.background = "";
            }, 1500);
        }
    }

};
