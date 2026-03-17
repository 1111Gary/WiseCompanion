// modules/engines/opportunityEngine.js
import ROIEngine from './roiEngine.js';

export const OpportunityEngine = {
    ANCHOR_RATE: 0.02, // 2% 的无风险收益基准

    calculateTierEfficiency(tiers) {
        // tiers: [{threshold: 50000, reward: 100}, {threshold: 100000, reward: 150}]
        if (!tiers || tiers.length < 2) return tiers[0];

        let bestTier = tiers[0];
        for (let i = 1; i < tiers.length; i++) {
            const extraCapital = tiers[i].threshold - tiers[i-1].threshold;
            const extraReward = tiers[i].reward - tiers[i-1].reward;
            
            // 计算边际年化收益率 (假设周期为 30 天)
            const marginalROI = (extraReward / extraCapital) * (360 / 30); 

            if (marginalROI > this.ANCHOR_RATE) {
                bestTier = tiers[i]; // 只有边际收益达标，才升级到高挡位
            } else {
                console.log(`战术预警：挡位 ${tiers[i].threshold} 边际效益过低，维持 ${tiers[i-1].threshold} 挡`);
            }
        }
        return bestTier;
    },
    build(tasks = [], profile = {}) {
        
        if (!Array.isArray(tasks)) return [];

        return tasks.map(task => {
            const type = task.task_type; // M1, M2, M3
            const tier = Number(task.agent_capital_threshold || 0);
            
            // --- 核心纠偏逻辑：计算中国式增量 ---
            let actualRequired = tier;
            let lockMode = "HARD"; // 默认死锁 (M2)

            if (type === 'M1') {
                lockMode = "SHARED"; // 升金任务是共享叠加态
                const bankKey = this.normalizeBank(task.source_app);
                // 重点：计算 (档位 - 上月日均基数)
                const lastMonthAvg = (profile.A && profile.A[bankKey]) || 0;
                actualRequired = Math.max(0, tier - lastMonthAvg);
            } else if (type === 'M3') {
                lockMode = "FREE";
                actualRequired = 0;
            }

            // --- 衔接 ROI 引擎 ---
            const roiData = ROIEngine.compute(task, actualRequired);

            const today = new Date();
            const holding = Number(task.t_plus_n || 0);
            const releaseDate = new Date(today.getTime() + holding * 86400000);

            return {
                id: task.id,
                title: task.title,
                bank: (task.source_app || "").trim(),
                task_type: type,
                lock_mode: lockMode, // 关键：交给 Scheduler 处理叠加
                capital_required: actualRequired,
                reward_estimate: roiData?.reward || 0,
                annual_roi: roiData?.annual_roi || 0,
                release_date: releaseDate.toISOString().slice(0, 10),
                holding_days: holding,
                combo_hint: task.agent_combo_hint
            };
        });
    },

    normalizeBank(name = '') {
        if (name.includes('工商')) return 'icbc';
        if (name.includes('建设')) return 'ccb';
        return 'other';
    }
};