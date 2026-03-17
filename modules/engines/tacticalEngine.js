import { getCycleKey } from '../utils/resetUtils.js';
export const TacticalEngine = {

    evaluate(task, profile, userStatuses = []) {

        const threshold =
            Number(task.agent_capital_threshold) || 0;

        const bank =
            task.source_app || '';

        const resetRule =
            task.reset_rule || 'DailyReset';

        const cycleKey =
            getCycleKey(resetRule);

        // =========================
        // 1 已完成检查
        // =========================

        const isFinished =
            userStatuses.some(s =>
                String(s.task_id) === String(task.id) &&
                s.cycle_key === cycleKey &&
                s.status === 'COMPLETED'
            );

        if (isFinished) {

            return {
                skip: true,
                note: '本周期已完成'
            };

        }

        const bankKey = this.normalizeBankName(task.source_app);
        const tierGoal = Number(task.agent_capital_threshold) || 0;

        // 计算 A 和 B 账户的攻击压力 (X)
        const getPressure = (acc) => {
            const lastAvg = profile.lastMonthAverages?.[acc]?.[bankKey] || 0;
            const current = profile[acc]?.[bankKey] || 0;
            // 如果 current 远低于 lastAvg + tierGoal，说明这个账户急需补钱
            return (lastAvg + tierGoal) - current;
        };

        const pressureA = getPressure('A');
        const pressureB = getPressure('B');

        // 谁的压力大（即谁离目标远），谁就作为本次任务的执行者
        const executor = pressureA >= pressureB ? 'A' : 'B';

        return {

            skip: false,

            is_locked,

            executor,

            channel: 'APP自动调度',

            capital_available: availableCapital,

            capital_required: threshold,

            note

        };

    }

};