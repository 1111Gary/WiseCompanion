import { runDisciplineEngine } from "../engines/disciplineEngine.js";
import { StrategyEngine } from "../engines/strategyEngine.js";
import { RecommendEngine } from "../engines/recommendEngine.js";

export const DecisionEngine = {

    build(tasks, profile){
        if(!tasks || tasks.length === 0){
            return [];
        }
// 🔴 严密逻辑：如果 profile 里的字段名是 totalFunds 而不是 total，这里要对齐
        const discipline = runDisciplineEngine({
            totalFunds: profile.totalFunds || 0,
            tierAmount: profile.tierAmount || 500000,
            currentAverageBalance: profile.currentAverageBalance || 0,
            currentDay: profile.currentDay || new Date().getDate(),
            daysInMonth: profile.daysInMonth || 30
        });
        

        // 2 战术过滤
        const filtered =
            StrategyEngine.filter(
                tasks,
                discipline
            );

        // 3 推荐排序
        const recommended =
            RecommendEngine.build(
                filtered,
                profile
            );

            

        return recommended;

    }

}