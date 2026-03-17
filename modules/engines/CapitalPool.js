// modules/engines/CapitalPool.js
export const CapitalPool = {
    build(profile = {}) {
        const total = Number(profile.total || 0);
        const locked = Array.isArray(profile.locked) ? profile.locked : [];

        // 1. 分离硬锁和共享锁
        const hardPositions = locked.filter(l => l.lock_mode === 'HARD');
        const sharedPositions = locked.filter(l => l.lock_mode === 'SHARED');

        // 2. 计算硬锁总额 (M2/消费/转出)
        const hardLockedAmount = hardPositions.reduce((sum, l) => sum + Number(l.amount || 0), 0);

        // 3. 计算共享锁峰值 (M1 升金：同一笔钱打多场仗)
        const sharedPeakAmount = sharedPositions.length > 0 
            ? Math.max(...sharedPositions.map(l => Number(l.amount || 0))) 
            : 0;

        // 4. 计算逻辑锁定总额
        const effectiveLocked = hardLockedAmount + sharedPeakAmount;

        return {
            total,
            available: total - effectiveLocked,
            effectiveLocked,
            hardLockedAmount,
            sharedPeakAmount,
            details: locked
        };
    }
};