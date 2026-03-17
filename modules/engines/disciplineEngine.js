// ==============================
// 纪律引擎 v3 完整版
// ==============================
import { getLocalDateKey } from '../utils/dateUtils.js';
export function runDisciplineEngine(input) {
    if (!input)
        return {
            stage: 'N/A',
            completion: '0%',
            dsm: 0,
            requiredDaily: 0,
            mode: 'stable',
            ssi: 100,
            survivalFlag: false
        };


    const { totalFunds, tierAmount, currentAverageBalance, currentDay, daysInMonth } = input;
    const stage = getStage(currentDay, daysInMonth);
    const core = calculateCoreMetrics({ tierAmount, currentAverageBalance, currentDay, daysInMonth });

    const survivalFlag = core.recommendedDaily > totalFunds;

    // 🟢 无论是否生存危机，都必须计算这些核心指标
    const risk = calculateRiskScore({ dsm: core.dsm, survivalFlag, stage });
    const zone = calculateStructureZone({ dsm: core.dsm, survivalFlag, riskLevel: risk.riskLevel });
    const ssi = calculateSSI({ dsm: core.dsm, survivalFlag, stage });



    // --- 分支 A：生存危机模式 ---
    if (survivalFlag) {
        const remainingDays = daysInMonth - currentDay;
        const theoreticalMaxTier = (currentAverageBalance * currentDay + totalFunds * remainingDays) / daysInMonth;
        const safeTier = Math.floor(theoreticalMaxTier * 0.95);

        return {
            stage,
            completion: core.completion,
            dsm: core.dsm,
            requiredDaily: core.requiredDaily,
            recommendedDaily: core.recommendedDaily,
            survivalFlag: true,
            mode: "decision_required", // 状态：需要决策
            decisionOptions: { restructure: safeTier, extreme: true },
            risk,
            zone,
            ssi
        };
    }
    // --- 分支 B：正常运营模式 ---
    let mode = "stable";
    if (stage === "K1") mode = handleK1(core.dsm);
    else if (stage === "K2") mode = handleK2(core.dsm);
    else if (stage === "K3") mode = handleK3(core.dsm);

    return {
        stage,
        completion: core.completion,
        dsm: core.dsm,
        requiredDaily: core.requiredDaily,
        recommendedDaily: core.recommendedDaily,
        survivalFlag: false,
        mode,
        decisionOptions: null, // 正常模式下不需要调整方案
        risk,
        zone,
        ssi
    };
}
//风险函数
function calculateRiskScore({ dsm, survivalFlag, stage }) {

    let base = 1;

    if (dsm <= 1.1) base = 1;
    else if (dsm <= 1.3) base = 2;
    else if (dsm <= 1.6) base = 3;
    else if (dsm <= 2.2) base = 4;
    else base = 5;

    let survivalPenalty = survivalFlag ? 2 : 0;

    let stageModifier = 0;

    if (stage === "K1") stageModifier = 1;
    if (stage === "K2") stageModifier = 0;
    if (stage === "K3") stageModifier = -1;

    let riskScore = base + survivalPenalty + stageModifier;

    if (riskScore < 1) riskScore = 1;
    if (riskScore > 7) riskScore = 7;

    let riskLevel = "A";

    if (riskScore <= 2) riskLevel = "A";
    else if (riskScore <= 4) riskLevel = "B";
    else if (riskScore === 5) riskLevel = "C";
    else riskLevel = "D";

    return {
        riskScore,
        riskLevel
    };
}

// ==============================
// 第二优先级：阶段行为判断
// ==============================






// ==============================
// 阶段计算
// ==============================

function getStage(currentDay, daysInMonth) {

    const ratio = currentDay / daysInMonth;

    if (ratio <= 0.4) return "K1";
    if (ratio <= 0.8) return "K2";
    return "K3";
}



// ==============================
// 核心数学计算
// ==============================

function calculateCoreMetrics({
    tierAmount,
    currentAverageBalance,
    currentDay,
    daysInMonth
}) {

    const totalRequiredArea = tierAmount * daysInMonth;
    const completedArea = currentAverageBalance * currentDay;

    const remainingArea = totalRequiredArea - completedArea;
    const remainingDays = daysInMonth - currentDay;

    let requiredDaily = tierAmount;
    let dsm = 1;

    if (remainingDays > 0) {
        requiredDaily = remainingArea / remainingDays;
        dsm = requiredDaily / tierAmount;
    }

    const recommendedDaily = requiredDaily * 1.05; // 5%缓冲

    const completionRatio =
        (completedArea / totalRequiredArea);

    return {
        dsm: Number(dsm.toFixed(2)),
        requiredDaily: Math.round(requiredDaily),
        recommendedDaily: Math.round(recommendedDaily),
        completion: Math.round(completionRatio * 100) + "%"
    };
}



// ==============================
// K1 行为规则
// ==============================

function handleK1(dsm) {

    if (dsm <= 1.1) return "stable";
    if (dsm <= 1.5) return "recovery_soft";
    return "recovery_hard";
}



// ==============================
// K2 行为规则
// ==============================

function handleK2(dsm) {

    if (dsm <= 1.3) return "stable";
    if (dsm <= 2.0) return "recovery_soft";
    return "recovery_hard";
}



// ==============================
// K3 行为规则
// ==============================

function handleK3(dsm) {

    if (dsm <= 1.8) return "stable";
    return "extreme_push";
}
//结构安全分区标准模型（Structure Safety Zoning Model）
function calculateStructureZone({ dsm, survivalFlag, riskLevel }) {

    if (
        dsm <= 1.3 &&
        !survivalFlag &&
        (riskLevel === "A" || riskLevel === "B")
    ) {
        return "SAFE";
    }

    if (
        (!survivalFlag && dsm <= 2.2) ||
        riskLevel === "C"
    ) {
        return "ALERT";
    }

    return "DANGER";
}

//结构稳定度指数（Structure Stability Index, SSI）
export function calculateSSI({ dsm, survivalFlag, stage }) {

    let pressurePenalty = 0;

    if (dsm > 1) {
        pressurePenalty = (dsm - 1) * 35;
    }

    let survivalPenalty = survivalFlag ? 25 : 0;

    let stageBonus = 0;

    if (stage === "K1") stageBonus = -5;
    if (stage === "K2") stageBonus = 0;
    if (stage === "K3") stageBonus = 3;

    let ssi = 100 - pressurePenalty - survivalPenalty + stageBonus;

    if (ssi > 100) ssi = 100;
    if (ssi < 0) ssi = 0;

    return Math.round(ssi);
}

//短期结构趋势预测模型（7-Day Forward Projection）
export function projectSSIForward({
    totalFunds,
    tierAmount,
    currentAverageBalance,
    currentDay,
    daysInMonth
}) {

    const forwardDays = 7;

    const newDay = currentDay + forwardDays;

    if (newDay >= daysInMonth) return null;

    const completedArea =
        currentAverageBalance * currentDay;

    const futureAddedArea =
        currentAverageBalance * forwardDays;

    const newCompletedArea =
        completedArea + futureAddedArea;

    const remainingDays =
        daysInMonth - newDay;

    const targetArea =
        tierAmount * daysInMonth;

    const newRemainingArea =
        targetArea - newCompletedArea;

    const newRequiredDaily =
        newRemainingArea / remainingDays;

    const newDSM =
        newRequiredDaily / tierAmount;

    const newSurvival =
        newRequiredDaily > totalFunds;

    const newStage =
        newDay <= daysInMonth * 0.33
            ? "K1"
            : newDay <= daysInMonth * 0.66
                ? "K2"
                : "K3";

    const newSSI = calculateSSI({
        dsm: newDSM,
        survivalFlag: newSurvival,
        stage: newStage
    });

    return {
        projectedDSM: Number(newDSM.toFixed(2)),
        projectedSSI: newSSI,
        projectedStage: newStage,
        projectedSurvival: newSurvival
    };
}

//情景模拟引擎（Scenario Engine）
export function simulateScenario({
    totalFunds,
    tierAmount,
    currentAverageBalance,
    currentDay,
    daysInMonth,
    deltaExecutionPercent = 0,
    deltaFundsPercent = 0
}) {

    const simulatedExecution =
        currentAverageBalance * (1 + deltaExecutionPercent / 100);

    const simulatedFunds =
        totalFunds * (1 + deltaFundsPercent / 100);

    return runDisciplineEngine({
        totalFunds: simulatedFunds,
        tierAmount,
        currentAverageBalance: simulatedExecution,
        currentDay,
        daysInMonth
    });
}

//结构缓冲率（Structure Buffer Ratio, SBR）
export function calculateBufferRatio({
    totalFunds,
    tierAmount,
    currentAverageBalance,
    currentDay,
    daysInMonth
}) {
    // 🔴 修复：如果当前日均为 0，缓冲必然是 0
    if (!currentAverageBalance || currentAverageBalance <= 0) return 0;
    const targetArea = tierAmount * daysInMonth;

    const remainingDays = daysInMonth - currentDay;

    if (remainingDays <= 0) return 0;

    // 让 DSM = 2.2
    const dangerRequiredDaily = 2.2 * tierAmount;

    const maxRemainingArea =
        dangerRequiredDaily * remainingDays;

    const minCompletedArea =
        targetArea - maxRemainingArea;

    const minExecution =
        minCompletedArea / currentDay;

    const bufferPercent =
        ((currentAverageBalance - minExecution) /
            currentAverageBalance) * 100;

    const safeSBR = Math.min(100, Math.max(0, Number(bufferPercent.toFixed(1))));
    return safeSBR;
}

//结构韧性指数（Resilience Index）
export function calculateSRI({ ssi, sbr, dsm }) {

    const stabilityComponent = ssi * 0.5;

    const normalizedBuffer =
        Math.min(sbr, 50) * 1.2;

    const bufferComponent =
        normalizedBuffer * 0.3;

    const pressurePenalty =
        dsm > 1 ? (dsm - 1) * 15 : 0;

    let sri =
        stabilityComponent +
        bufferComponent -
        pressurePenalty;

    if (sri > 100) sri = 100;
    if (sri < 0) sri = 0;

    return Math.round(sri);
}

/**
 * 核心精算：计算单行/单账户的今日执行值 X
 */
export function calculateBankDailyX(bankKey, accountType, tierGoal, profile) {
    const todayStr = getLocalDateKey();
    const currentDay = parseInt(todayStr.split('-')[2]);
    const daysInMonth = 31; // 以后可根据月份动态获取
    const remainingDays = (daysInMonth - currentDay) + 1;

    // 1. 获取 2 月底色 (Carry-over)
    const lastMonthAvg = profile.lastMonthAverages?.[accountType]?.[bankKey] || 0;

    // 2. 目标月均与总积分缺口
    const targetAvg = lastMonthAvg + tierGoal;
    const totalRequiredPoints = targetAvg * daysInMonth;

    // 3. 已产生积分 (截至昨日)
    const currentBalance = Number(profile[accountType][bankKey]) || 0;
    const achievedPoints = currentBalance * (currentDay - 1);

    // 4. 算出 X 值 (增加 5% 缓冲)
    const X = (totalRequiredPoints - achievedPoints) / remainingDays;

    return {
        bank: bankKey,
        account: accountType,
        requiredDaily: Math.max(0, X),
        recommendedDaily: Math.max(0, X * 1.05),
        isSafe: currentBalance >= X
    };
}

/**
 * 全局精算包装器：一次性算清所有活动压力
 */
export function runUnifiedActuarial(tasks, profile) {
    const banks = ['icbc', 'ccb', 'boc', 'abc', 'bocom'];
    let totalRealTime = 0;
    let totalLastAvg = 0;
    let weakPoints = [];

    // 1. 逐个银行计算“资产饱和度”
    banks.forEach(bank => {
        const current = (profile.A?.[bank] || 0) + (profile.B?.[bank] || 0);
        const baseline = (profile.lastMonthAverages?.A?.[bank] || 0) + (profile.lastMonthAverages?.B?.[bank] || 0);

        totalRealTime += current;
        totalLastAvg += baseline;

        // 如果实时资产低于底色的 90%，视为“失分项”
        if (baseline > 0 && (current / baseline) < 0.9) {
            weakPoints.push(bank.toUpperCase());
        }
    });

    // 2. 计算 SSI (System Stability Index) 系统稳定性指数
    // 逻辑：总实时 / 总底色，反映整体资产水位
    const ssi = totalLastAvg > 0 ? Math.min(100, Math.round((totalRealTime / totalLastAvg) * 100)) : 100;

    // 3. 计算韧性等级 (Resilience Level)
    let resilience = 'AA';
    if (ssi < 95) resilience = 'A';
    if (ssi < 85) resilience = 'B';
    if (ssi < 70) resilience = 'C';
    if (weakPoints.length > 2) resilience = 'B'; // 超过2家银行掉队，直接降级

    return {
        ssi,
        resilience,
        weakPoints,
        activeTotal: totalRealTime,
        baselineTotal: totalLastAvg,
        dsm: ssi // 达标率
    };
}

export const DisciplineEngine = {
    /**
     * 计算每日强制执行值 X
     * @param {Object} context 包含：上月底色, 目标增量(挡位), 已产生积分, 总天数, 剩余天数
     */
    calculateDailyX(context) {
        const { lastAvg, targetTier, accumulatedPoints, totalDays, remainingDays } = context;

        // 目标月均 = 上月底色 + 目标挡位 (人为制造增量)
        const targetMonthlyAvg = lastAvg + targetTier;

        // 每日执行值 X = (目标月均 * 总天数 - 已产生积分) / 剩余天数
        let x = (targetMonthlyAvg * totalDays - accumulatedPoints) / remainingDays;

        // 加上 5% 安全锁 (Safety Buffer)
        x = x * 1.05;

        // 如果 X <= 0，逻辑校验：显示为“已达标”
        return x <= 0 ? 0 : Math.ceil(x);
    },

    async getRealAccumulatedPoints(dbClient) {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // 从每日余额快照表或账本历史中拉取
        const { data, error } = await dbClient
            .from('daily_balance_snapshots') // 假设你有这张表记录每日结余
            .select('balance')
            .gte('snapshot_date', firstDay);

        if (error || !data) return 0;

        // 积分累加：Sum(每日余额)
        return data.reduce((sum, row) => sum + Number(row.balance), 0);
    },

    // 核心精算模型：月均达成预测
    calculateMonthlyProjection(currentPoints, newTierAmount, totalDays, today) {
        const remainingDays = totalDays - today + 1;
        // 预计到月底的总积分 = 已经产生的 + (现在的余额 + 新增锁仓) * 剩余天数
        // 注意：这里的底仓需要实时获取，假设为 currentBalance
        const currentBalance = window.USER_PROFILE?.current_total_balance || 0;
        const projectedPoints = currentPoints + (currentBalance + newTierAmount) * remainingDays;

        return projectedPoints / totalDays;
    },

    async getRealAccumulatedPoints() {
        const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

        const { data, error } = await window.sbClient
            .from('sri_daily_snapshot')
            .select('raw_payload') // 假设 raw_payload 里存了当天的总余额
            .gte('snapshot_date', firstDay);

        if (error || !data) return 0;

        // 计算本月已产生的“积分” (余额 * 天数)
        return data.reduce((sum, row) => sum + (row.raw_payload.total_balance || 0), 0);
    },

    // 科学月均精算模型
    calculateScientificSSI(currentPoints, newLockAmount, totalCapital) {
        const now = new Date();
        const today = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const remainingDays = daysInMonth - today + 1;

        // 累计积分 = 历史真实积分 + (当前总本金 + 本次新增锁仓) * 剩余天数
        const totalProjectedPoints = currentPoints + (totalCapital + newLockAmount) * remainingDays;

        // 目标积分 = 目标月均 (假设 10w) * 总天数
        const targetPoints = 100000 * daysInMonth;

        return {
            ssi: Math.min(100, (totalProjectedPoints / targetPoints) * 100).toFixed(1),
            projectedAvg: totalProjectedPoints / daysInMonth
        };
    },

    calculateRealSSI(historicalPoints, currentBalance, totalCapital) {
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const today = new Date().getDate();
        const remainingDays = daysInMonth - today + 1;



        // 如果当前穿仓，给一个“穿仓系数”，比如 0.8
        const weight = currentBalance < 0 ? 0.5 : 1.0;

        // 积分预估：历史 + (当前余额 * 剩余天数 * 权重)
        const projectedPoints = historicalPoints + (currentBalance * remainingDays * weight);
        const targetPoints = totalCapital * daysInMonth;
        if (targetPoints === 0) return 0; // 杜绝除以0的情况

        // 这里的 SSI 是真实的月均达成预估
        let ssi = (projectedPoints / targetPoints) * 100;

        // 物理熔断：如果现在兜里没钱，SSI 封顶不能过 95%，必须留 5% 的风险缺口显示
        if (currentBalance < 0) ssi = Math.min(ssi, 85.0);

        return parseFloat(ssi.toFixed(1));
    }
};