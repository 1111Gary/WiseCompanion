// modules/logic/tacticalEvaluator.js

export const TacticalEvaluator = {
    /**
     * 核心判定函数
     * @param {Object} profile 用户战术画像 (Total Capital, AUM底色等)
     * @param {Object} task 当前任务
     * @param {Number} tier 拟参加挡位
     */
    evaluate(profile, task, tier) {
        const totalCap = profile.total_capital || 0;
        const currentLocked = profile.total_locked || 0;
        const availableCap = totalCap - currentLocked;

        // --- 判定 1: 资金匹配度 (Logic Gate) ---
        if (tier > availableCap) {
            return { 
                pass: false, 
                msg: `资金头寸不足！当前可用 ￥${availableCap.toLocaleString()}，无法支撑 ${tier/10000}万 挡位。` 
            };
        }

        // --- 判定 2: AB 账户拆分必要性 ---
        let suggestedAccount = 'A';
        const needsSplit = totalCap > 100000; // 资金量超过 100K 激活 AB 判定

        if (needsSplit) {
            // 获取该银行 A 和 B 的 2 月底色
            const avgA = profile.last_avg_a?.[task.bank_key] || 0;
            const avgB = profile.last_avg_b?.[task.bank_key] || 0;

            // Sin 函数攻击逻辑：谁基数低谁上
            suggestedAccount = avgA <= avgB ? 'A' : 'B';
            console.log(`[Sin-Attack] 检测到资金充足，系统指派基数更低的账户 ${suggestedAccount} 执行任务。`);
        } else {
            console.log(`[Single-Stream] 资金量 ￥${totalCap} 较小，建议集中火力使用主账户 A，不建议拆分。`);
        }

        return { 
            pass: true, 
            suggestedAccount, 
            msg: `匹配成功！建议由账户 ${suggestedAccount} 承接。` 
        };
    }
};