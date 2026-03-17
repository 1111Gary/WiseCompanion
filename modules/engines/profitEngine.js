// modules/engines/profitEngine.js

export const ProfitEngine = {
    /**
     * @param {Array} dbLocks 账本数据
     * @param {Array} allTasks 任务配置
     * @param {Number} m7Rate 货币基金/活期年化收益率 (默认 2.0%)
     */
    calculateTotalROI(dbLocks, allTasks, m7Rate = 0.02) {
        let bankRewards = 0;
        let capitalEarnings = 0;

        // 1. 计算银行任务奖励
        dbLocks.forEach(lock => {
            const task = allTasks.find(t => t.id === lock.task_id);
            if (task?.agent_tier_config) {
                const config = typeof task.agent_tier_config === 'string' ? 
                               JSON.parse(task.agent_tier_config) : task.agent_tier_config;
                const tier = config.find(t => Number(t.min) === Number(lock.capital_locked));
                bankRewards += (tier ? Number(tier.reward || 0) : 0);
            }

            // 2. 计算货基收益 (复利感的核心)
            // 逻辑：锁仓金额 * 年化利率 / 365 * 锁仓天数 (暂按 30 天月计)
            const lockedAmount = Number(lock.capital_locked);
            capitalEarnings += (lockedAmount * m7Rate / 12); 
        });

        return {
            total: bankRewards + capitalEarnings,
            rewards: bankRewards,
            interest: capitalEarnings
        };
    }
};