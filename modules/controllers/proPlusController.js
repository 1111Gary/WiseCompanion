// modules/controllers/proPlusController.js
import { ProPlusRenderer } from '../render/proPlusRenderer.js';
import { TacticalManager } from './tacticalManager.js';
import { MembershipManager } from './membershipManager.js'; // 🔴 新增这行
import { calculateBankDailyX, runUnifiedActuarial, projectSSIForward, calculateBufferRatio, calculateSRI, DisciplineEngine } from '../engines/disciplineEngine.js';
import { OpportunityEngine } from '../engines/opportunityEngine.js';
import { CapitalScheduler } from '../engines/capitalScheduler.js';
import { ProfitEngine } from '../engines/profitEngine.js';
import { RiskEngine } from '../engines/riskEngine.js';
import { Scheduler } from '../engines/scheduler.js';


export const ProPlusController = {
    fullSnapshot: null,
    _cachedTimeline: [],

    async init() {
        console.log("ProPlusController Initializing...");

        // 1. 基础结构渲染
        if (!document.getElementById('pro-plus-modal')) {
            ProPlusRenderer.renderStructure();
        }

        // 2. 获取并校准画像（核心：先校准，再使用）
        const rawProfile = TacticalManager.get();
        if (!rawProfile) return console.error("无法获取本地配置数据");

        // 自动对齐 UI (跨月检查等)，得到最终可用的 profile
        const calibratedProfile = TacticalManager.autoCalibrate(rawProfile);
        TacticalManager.populateUI(calibratedProfile);

        // 3. 执行精算视图刷新
        const totalCapital = window.USER_PROFILE?.total_capital || 0;
        // 🔴 关键修正：将校准后的 profile 传进去

        await this.autoSnapshotCheck();
        await this.refreshActuarialView(totalCapital, calibratedProfile);
    },

    async autoSnapshotCheck() {
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: existing } = await window.sbClient
            .from('sri_daily_snapshot')
            .select('id')
            .eq('snapshot_date', todayStr)
            .maybeSingle();

        if (!existing) {
            console.log("📅 正在生成今日精算快照...");
            // 存入当前的核心数据
            await window.sbClient.from('sri_daily_snapshot').insert({
                snapshot_date: todayStr,
                user_id: (await window.sbClient.auth.getUser()).data.user.id,
                sri_score: this.fullSnapshot?.ssi || 100,
                sri_level: this.fullSnapshot?.riskLevel || 'SAFE',
                model_version: '3.0-Flash',
                raw_payload: {
                    total_balance: window.USER_PROFILE?.total_capital,
                    available_balance: this.fullSnapshot?.availableAmount
                }
            });
        }
    },

    calculateLocked(dbLocks) {
        if (!dbLocks || dbLocks.length === 0) return 0;

        const bankMaxLocks = {};
        dbLocks.forEach(l => {
            const bank = l.source_app || 'Unknown';
            const val = Number(l.capital_locked) || 0;
            // 核心精算：同一银行只取最大值，不重复占用本金
            if (!bankMaxLocks[bank] || val > bankMaxLocks[bank]) {
                bankMaxLocks[bank] = val;
            }
        });

        return Object.values(bankMaxLocks).reduce((a, b) => a + b, 0);
    },

    async refreshActuarialView(totalCap, profile) {
        try {
            // A. 基础数据获取
            const { data: dbLocks } = await window.sbClient.from('capital_ledger').select('*').eq('status', 'active');
            const tasks = window.ALL_TASKS || [];
            // B. 模块化计算 (互不干扰)
            const lockedAmount = this.calculateLocked(dbLocks);
            // 1. 风险评估 (RiskEngine)
            const risk = RiskEngine.evaluateStatus(totalCap, lockedAmount);

            // 2. 收益精算 (ProfitEngine)
            const roi = ProfitEngine.calculateTotalROI(dbLocks, tasks, 0.014);

            // 3. 积分预判 (DisciplineEngine)
            const historyPoints = await DisciplineEngine.getRealAccumulatedPoints();
            const ssi = DisciplineEngine.calculateRealSSI(historyPoints, risk.available, totalCap);

            const opportunities = OpportunityEngine.build(tasks, profile);
            const scheduleResult = CapitalScheduler.schedule(opportunities, {
                ...profile,
                total: totalCap,
                locked: dbLocks // 这里的 dbLocks 会被 Scheduler 内部解析
            });


            // 4. 日历编排 (Scheduler)
            const timeline = Scheduler.generateTimeline(tasks, profile, dbLocks);

            // C. 统一分发包裹
            this.fullSnapshot = {
                ...profile,
                lockedAmount: lockedAmount,
                total_capital: totalCap,
                availableAmount: risk.available,
                risk: risk,
                ssi: DisciplineEngine.calculateRealSSI(0, risk.available, totalCap),
                expectedROI: roi.total,
                rewardPart: roi.rewards,
                interestPart: roi.interest,
                timeline: scheduleResult.timeline
            };

            // D. 触发渲染
            ProPlusRenderer.renderCalendar(this.fullSnapshot.timeline, totalCap);
            this.refreshUI();

        } catch (error) {
            console.error("精算指挥中心故障:", error);
        }
    },


    _updateStatDOM(id, value) {
        const el = document.getElementById(id);
        if (el) el.innerText = `￥${value.toLocaleString()}`;
    },
    //渲染日历的基础
    _buildTimeline(tasks, profile, actuarial) {
        const opportunities = OpportunityEngine.build(tasks, profile);
        const scheduleResult = CapitalScheduler.schedule(opportunities, profile);

        return scheduleResult.timeline.map(day => ({
            ...day,
            globalSSI: actuarial.ssi,
            canMove: (parseFloat(this.fullSnapshot?.sbr) || 0) > 5
        }));
    },
    // 提取出来的渲染总控
    refreshUI() {
        const s = this.fullSnapshot;
        if (!s) return;

        // 更新顶部日期和状态
        const dateMain = document.getElementById('pp-date-main');
        if (dateMain) dateMain.innerText = `${new Date().getMonth() + 1}.${new Date().getDate()}`;

        // 渲染大钱袋子
        const roiContainer = document.getElementById('pp-roi-container');
        if (roiContainer) roiContainer.innerHTML = ProPlusRenderer.renderROICard(s);

        if (ProPlusRenderer.renderSampling) {
            ProPlusRenderer.renderSampling(s);
        }

        this.renderOverview();
        this.renderCalendar(s.timeline);

        ProPlusRenderer.renderIntent(s);
        // 绑定事件
        this.bindCalendarEvents();
        this.bindConfigEvents();
    },

    async getLockedSnapshot() {
        const { data } = await window.sbClient
            .from('capital_ledger')
            .select('capital_locked, account_name')
            .eq('status', 'active');

        return data.reduce((acc, curr) => {
            acc[curr.account_name] = (acc[curr.account_name] || 0) + Number(curr.capital_locked);
            acc.total += Number(curr.capital_locked);
            return acc;
        }, { A: 0, B: 0, total: 0 });
    },


    renderCalendar(timeline, totalCapital = 350000) {
        const calendarGrid = document.getElementById('pp-calendar-grid');
        if (!calendarGrid || !timeline) return;

        calendarGrid.innerHTML = timeline.map(day => {
            // 1. 节假日逻辑 (保持你现在的)
            const isWeekend = [6, 0].includes(new Date(2026, 2, day.day).getDay());
            const trapClass = isWeekend ? 'holiday-trap' : '';

            // 2. 🔴 修复：水位计算，确保 day.free 是真实数字
            // 如果 free 是负数（穿仓），水位线显示为 100% 红色警告
            const isOverload = day.free < 0;
            const waterHeight = isOverload ? 100 : Math.min(100, Math.max(0, (day.free / totalCapital) * 100));
            const waterColorClass = isOverload ? 'line-w' : 'line-a'; // line-w 对应红色 CSS

            return `
                <div class="calendar-day ${day.isToday ? 'today' : ''} ${trapClass} ${isOverload ? 'overload' : ''}" 
                    onclick="window.ProPlusController.handleDayClick(${day.day})"
                    style="cursor: pointer; position: relative; overflow: hidden; z-index:1;">
                    
                    <span class="day-num ${day.taskCount > 0 ? 'day-active' : ''}" style="position:relative; z-index:3;">${day.day}</span>
                    
                    <div class="water-line ${waterColorClass}" style="height: ${waterHeight}%; position:absolute; bottom:0; left:0; width:100%; z-index:1; transition: height 0.3s ease;"></div>
                    
                    <div class="day-status-dot" style="background: ${isOverload ? '#ff4d4f' : (day.taskCount > 0 ? '#52c41a' : '#333')}; z-index: 3;"></div>
                    
                    ${isOverload ? '<div class="day-warning" style="z-index:3; position:absolute; top:2px; right:2px; color:#ff4d4f; font-weight:bold; font-size:10px;">!</div>' : ''}
                </div>
            `;
        }).join('');
    },
    handleDayClick(dayNum) {
        // 1. 每次点击先清空之前的状态 Class
        const box = document.getElementById('pp-value-box');
        if (!box) return;

        // 2. 找到对应日期数据
        const dayData = this.fullSnapshot?.timeline?.find(d => d.day === dayNum);

        if (dayData) {
            // 3. 🔴 关键：渲染合并后的“采样详情（带光晕特效）”
            ProPlusRenderer.renderDayDetailHTML(dayData);

            document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
            event.currentTarget.classList.add('selected');

            // 4. 显示并平滑滚动
            box.style.display = 'block';
            // 5. 确保点击后不会被其他东西挡住，重置指针事件
            box.style.pointerEvents = 'auto';
        }
    },

    bindCalendarEvents() {
        const grid = document.getElementById('pp-calendar-grid');
        if (!grid || grid.dataset.bound === 'true') return; // 防止重复绑定

        grid.addEventListener('click', (e) => {
            const dayEl = e.target.closest('.calendar-day');
            if (!dayEl) return;

            const idx = dayEl.dataset.day;
            const dayData = this._cachedTimeline[idx];

            if (dayData) {
                console.log("👆 点击采样:", dayData);
                this.showDayDetail(idx, dayData);
            }
        });

        grid.dataset.bound = 'true'; // 标记已绑定
    },

    bindConfigEvents() {
        const toggleBtn = document.getElementById('pp-toggle-config');
        const drawer = document.getElementById('pp-config-drawer');

        if (toggleBtn && drawer) {
            toggleBtn.onclick = () => {
                const isHidden = drawer.style.display === 'none';
                drawer.style.display = isHidden ? 'block' : 'none';
                toggleBtn.innerText = isHidden ? '收起细节配置 ↑' : '展开细节配置 ↓';
            };
        }
    },

    showDayDetail(idx, data) {
        const box = document.getElementById('pp-value-box');
        if (!box) return;

        // 🔴 魔法在这里：Controller 不写 HTML，只调用 Renderer 提供的内容
        box.innerHTML = ProPlusRenderer.renderDayDetailHTML(idx, data);
        box.style.display = 'block';
    },

    renderOverview(result) {
        const dateMain = document.getElementById('pp-date-main');
        if (dateMain) dateMain.innerText = `${new Date().getMonth() + 1}.${new Date().getDate()}`;
    },


    openGlobal() {
        if (!MembershipManager.isMember()) {
            MembershipManager.openInviteModal();
            return;
        }
        const modal = document.getElementById('pro-plus-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
        }

        const syncBtn = document.getElementById('pp-sync-trigger');
        if (syncBtn) syncBtn.onclick = () => TacticalManager.sync();

        setTimeout(() => {
            this.init(window.ALL_TASKS || [], window.USER_STATUSES || []);
        }, 50);
    },

    close() {
        const modal = document.getElementById('pro-plus-modal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    }
};

window.ProPlusController = ProPlusController;