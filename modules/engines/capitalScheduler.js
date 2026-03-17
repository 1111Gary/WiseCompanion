// modules/engines/capitalScheduler.js
export const CapitalScheduler = {
    schedule(opportunities = [], profile = {}) {
        const totalFunds = Number(profile.total_capital || profile.total || 0);
        const daysInMonth = 31;
        const now = new Date();
        const todayIdx = now.getDate() - 1;

        // 1. 初始化 31 天阵列
        const timeline = Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,           // 🔴 注入 UI 渲染需要的 day 字段
            isToday: i === todayIdx, // 🔴 注入今日标记
            free: totalFunds,
            bankPeaks: {},
            hardLocked: 0,
            taskCount: 0          // 🔴 注入绿点显示需要的任务计数
        }));

        // 2. 注入底仓 (处理 profile.locked)
        if (profile.locked && Array.isArray(profile.locked)) {
            profile.locked.forEach(lock => {
                if (!lock.release_date) return;
                const releaseDay = parseInt(lock.release_date.split('-')[2]);

                // 在释放日期前的每一天扣除金额
                for (let d = 0; d < releaseDay && d < daysInMonth; d++) {
                    timeline[d].hardLocked += Number(lock.amount);
                    timeline[d].free -= Number(lock.amount);
                    
                    const b = lock.bank || 'Unknown';
                    timeline[d].bankPeaks[b] = (timeline[d].bankPeaks[b] || 0) + Number(lock.amount);
                    // 底仓也算一个任务占用，让日历亮起绿点
                    timeline[d].taskCount += 1;
                }
            });
        }

        // 3. 模拟填充新任务 (逻辑保持你的共享模型)
        const sortedOpps = [...opportunities].sort((a, b) => (b.annual_roi || 0) - (a.annual_roi || 0));
        const finalPlan = [];

        for (const opp of sortedOpps) {
            const start = this.getDayIndex(opp.start_date || now);
            const end = Math.min(daysInMonth - 1, start + (opp.holding_days || 1));

            let canFit = true;
            for (let i = start; i <= end; i++) {
                const day = timeline[i];
                if (!day) continue;
                const b = opp.bank;
                const currentPeak = day.bankPeaks[b] || 0;
                const extraGap = Math.max(0, opp.capital_required - currentPeak);
                if (day.free < extraGap) { canFit = false; break; }
            }

            if (canFit) {
                for (let i = start; i <= end; i++) {
                    const day = timeline[i];
                    const b = opp.bank;
                    const currentPeak = day.bankPeaks[b] || 0;
                    const extraGap = Math.max(0, opp.capital_required - currentPeak);
                    day.bankPeaks[b] = Math.max(currentPeak, opp.capital_required);
                    day.free -= extraGap;
                    day.taskCount += 1; // 🔴 任务填充成功，计数加1
                }
                finalPlan.push({ ...opp, status: 'SCHEDULED' });
            }
        }

        return { plan: finalPlan, timeline };
    },

    getDayIndex(dateStr) {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? new Date().getDate() - 1 : d.getDate() - 1;
    }
};