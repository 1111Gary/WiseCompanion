import ROIEngine from "./roiEngine.js";

export const ScoreEngine = {

    score(task, profile = {}) {

        const roiData = ROIEngine.compute(task);

        if (!roiData) return 0;

        const dailyROI =
            roiData.daily_roi || 0;

        const effectiveROI =
            roiData.effective_roi || 0;

        // ======================
        // ROI评分
        // ======================

        const roiScore =
            dailyROI * 1000;

        // ======================
        // 稳定性
        // ======================

        const stabilityScore =
            effectiveROI * 200;

        // ======================
        // 资金适配
        // ======================

        let capitalFit = 1;

        if (
            profile.total &&
            task.agent_capital_threshold
        ) {

            const threshold =
                Number(
                    task.agent_capital_threshold
                );

            capitalFit =
                Math.min(
                    profile.total / threshold,
                    1
                );

        }

        // ======================
        // 难度惩罚
        // ======================

        const difficultyPenalty =
            (task.agent_difficulty || 0) * 20;

        // ======================
        // 最终评分
        // ======================        
        const baseScore =
            Number(task.agent_base_score || 0);

        const probability =
            Number(task.success_probability || 1);

        const threshold =
            Number(task.agent_capital_threshold ?? 0);

        const userCapital =
            Number(profile.total || 0);

        // 如果资金不足，降低评分
        let capitalPenalty = 0;

        if (threshold > 0 && userCapital < threshold) {
            capitalPenalty = 50;
        }

        const finalScore =
            baseScore
            +
            (
                roiScore +
                stabilityScore
            )
            *
            capitalFit
            *
            probability
            -
            difficultyPenalty
            -
            capitalPenalty;

        return finalScore;

    }

};