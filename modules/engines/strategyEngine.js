// modules/engines/strategyEngine.js
export const StrategyEngine = {
    filter(tasks, discipline) {
        if (!discipline || !tasks || tasks.length === 0) return tasks;
        const { mode } = discipline;

        // 优先级：M1(核心资产) > M3(无成本维护) > M2(资金流转)
        const typePriority = { "M1": 3, "M3": 2, "M2": 1 };
        const sortedTasks = [...tasks].sort((a, b) => {
            const pA = typePriority[a.task_type] || 0;
            const pB = typePriority[b.task_type] || 0;
            return pB - pA;
        });

        if (mode === "stable") return sortedTasks;

        if (mode === "recovery_soft") {
            // 追赶模式：我们要保证效率。
            // 建议：保留 M1，保留不费钱的 M3，过滤掉中等占用且琐碎的 M2。
            return sortedTasks.filter(t => t.task_type !== "M2");
        }

        if (mode === "recovery_hard" || mode === "extreme_push") {
            // 紧急模式：资金极其短缺！
            // 动作：只允许看 M1（因为不达标会有巨大损失），甚至可以保留 M3（因为反正不花钱）。
            // 但绝对不能看 M2（因为转账和消费会进一步稀释你的日均资产）。
            return sortedTasks.filter(t => t.task_type === "M1" || t.task_type === "M3");
        }

        return sortedTasks;
    }
};