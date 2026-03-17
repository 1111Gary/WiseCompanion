//modules\engines\cashStructureEngine.js
export const CashStructureEngine = {

    compute(profile = {}) {

        const totalCash = profile.total || 0;
        const icbc = profile.icbc || 0;
        const ccb = profile.ccb || 0;

        // =========================
        // ① 收益效率 (30分)
        // =========================
        const effectiveYield = profile.estimatedYield || 0.028;
        const baseYield = 0.014;
        const yieldScore = Math.min((effectiveYield / baseYield) * 15, 30);

        // =========================
        // ② 流动性 (25分)
        // =========================
        const liquidityRatio = profile.t0Ratio || 0.6;
        const liquidityScore = liquidityRatio * 25;

        // =========================
        // ③ 升金效率 (20分)
        // =========================
        const avgReward = profile.avgRewardRate || 0.006;

        let leverageScore = 0;
        if (avgReward >= 0.008) leverageScore = 20;
        else if (avgReward >= 0.005) leverageScore = 12;
        else if (avgReward >= 0.002) leverageScore = 5;

        // =========================
        // ④ 集中度 (15分)
        // =========================
        const maxBankRatio = totalCash
            ? Math.max(icbc, ccb) / totalCash
            : 0;

        let concentrationScore = 15;

        if (maxBankRatio > 0.7) concentrationScore = 0;
        else if (maxBankRatio > 0.6) concentrationScore = 5;
        else if (maxBankRatio > 0.5) concentrationScore = 10;

        // =========================
        // ⑤ 全球准备 (10分)
        // =========================
        const usdRatio = profile.usdRatio || 0;
        const globalScore =
            usdRatio > 0.2 ? 10 :
            usdRatio > 0 ? 8 : 6;

        const totalScore = Math.round(
            yieldScore +
            liquidityScore +
            leverageScore +
            concentrationScore +
            globalScore
        );

        let level = "待优化";
        if (totalScore >= 80) level = "优秀";
        else if (totalScore >= 60) level = "稳健";

        return {
            totalScore,
            level,
            breakdown: {
                yield: Math.round(yieldScore),
                liquidity: Math.round(liquidityScore),
                leverage: leverageScore,
                concentration: concentrationScore,
                global: globalScore
            }
        };
    }

};