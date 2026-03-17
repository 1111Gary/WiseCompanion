//modules\engines\recommendEngineAdapter.js
import { TacticalManager } from '..//controllers/tacticalManager.js';
import { RecommendEngine } from './recommendEngine.js';

export function buildRecommendWithRadar(recommendList, scoreData) {

    if (!recommendList || recommendList.length === 0) return [];

    const profile = TacticalManager.get();

    const finalRecommend = RecommendEngine.build(
        recommendList,
        profile,
        {
            perTypeLimit: 1
        }
    );

    return finalRecommend;
}