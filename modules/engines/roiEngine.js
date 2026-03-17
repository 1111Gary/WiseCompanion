// modules/engines/roiEngine.js
const ROIEngine = {
    compute(task, capital) {
        if (!task) return null;

        // 1. 提取奖励
        const reward = this.parseReward(task.agent_reward_desc);
        
        // 2. 核心：计算真正的“资金占用天数” (holding_days)
        // 如果 task 没给 t_plus_n，我们用活动剩余天数兜底
        const holding = Number(task.t_plus_n) || 1; 

        if (capital <= 0) {
            return { reward, annual_roi: 0 }; // M3 任务 ROI 趋于无穷，不参与排序
        }

        // 3. 计算年化：(奖励 / 投入) * (365 / 占用天数)
        const effective_roi = reward / capital;
        const annual_roi = effective_roi * (365 / holding);

        return {
            reward,
            effective_roi,
            annual_roi
        };
    },

    parseReward(text) {
        if (!text) return 0;
        const match = text.match(/(\d+(\.\d+)?)/);
        return match ? Number(match[1]) : 0;
    }
};

export default ROIEngine;