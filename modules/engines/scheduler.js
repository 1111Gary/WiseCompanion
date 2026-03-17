// modules/engines/scheduler.js
//proplus内部使用日列模块

export const Scheduler = {
    // 核心职责：生成一个包含 31 天所有动作的数组
    generateTimeline(tasks, profile, dbLocks) {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const timeline = [];

        for (let d = 1; d <= daysInMonth; d++) {
            // 筛选出在该日期处于激活状态的任务
            const activeOnDay = dbLocks.filter(lock => {
                const start = new Date(lock.created_at).getDate();
                const end = new Date(lock.lock_end_date).getDate();
                return d >= start && d <= end;
            });

            // 计算该日由于锁仓产生的“真实可用头寸”
            const dayLocked = activeOnDay.reduce((s, l) => s + Number(l.capital_locked), 0);
            
            timeline.push({
                day: d,
                isToday: d === now.getDate(),
                locked: dayLocked,
                free: profile.total_capital - dayLocked,
                taskCount: activeOnDay.length
            });
        }
        return timeline;
    }
};