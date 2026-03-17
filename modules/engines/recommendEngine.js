//modules\engines\recommendEngine.js
import { ScoreEngine } from "./scoreEngine.js";

export const RecommendEngine = {

    build(tasks, profile){

        if(!tasks || tasks.length === 0){
            return [];
        }

        // 1 打分
        const scored = tasks.map(t => ({
            ...t,
            _score: ScoreEngine.score(t, profile)
        }));

        // 2 分桶
        const buckets = {
            M1: [],
            M2: [],
            M3: []
        };

        scored.forEach(t => {

            const type = t.task_type || "M3";

            if (buckets[type]) {
                buckets[type].push(t);
            }

        });

        // 3 每个桶排序
        Object.keys(buckets).forEach(k => {
            buckets[k].sort((a,b)=>b._score - a._score);
        });

        const result = [];

        if(buckets.M1.length) result.push(buckets.M1[0]);
        if(buckets.M2.length) result.push(buckets.M2[0]);

        // M3 特殊处理：取最多3个
        if(buckets.M3.length){
            result.push(...buckets.M3.slice(0,3));
        }

        return result.slice(0,3);

    }

}