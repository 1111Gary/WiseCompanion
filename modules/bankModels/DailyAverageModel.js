//日均模型
import { BaseBankModel } from './BaseBankModel.js';

export class DailyAverageModel extends BaseBankModel {

    evaluate(capitalAllocation = 0) {

        const task = this.task;

        const baseLastMonth =
            Number(task.last_month_avg) || 0;

        const tier =
            Number(task.agent_capital_threshold) || 0;

        const reward =
            this.extractReward(task.agent_reward_desc);

        const daysInMonth =
            new Date().getDate();

        const requiredDailyAvg =
            baseLastMonth + tier;

        const projectedDailyAvg =
            baseLastMonth + capitalAllocation;

        const qualified =
            projectedDailyAvg >= requiredDailyAvg;

        const nextMonthBase =
            projectedDailyAvg;

        return {

            qualified,

            requiredCapital: tier,

            reward,

            nextMonthBase,

            riskFlags: [],

            strategyHint: qualified
                ? '达标，可执行'
                : '需增加资金'

        };

    }

    extractReward(desc) {

        if (!desc) return 0;

        const match = desc.match(/(\d+(\.\d+)?)/);

        if (!match) return 0;

        return Number(match[1]);

    }

}