export const RiskEngine = {
    /**
     * @param {Number} totalCap 总本金 (如 350,000)
     * @param {Number} lockedAmount 已占用额
     */
    evaluateStatus(totalCap, lockedAmount) {
        const available = totalCap - lockedAmount;
        const usageRate = (lockedAmount / totalCap) * 100;
        
        // 默认蓝色状态：Safe
        let status = {
            level: 'SAFE',
            label: '✅ 资金充裕',
            color: '#52c41a', // 亮绿/蓝色调
            bg: 'rgba(82, 196, 26, 0.1)',
            canAction: true,
            desc: "流动性良好，可自由部署战术。"
        };

        // 穿仓红色状态：Critical
        if (available < 0) {
            status = {
                level: 'CRITICAL',
                label: '🚨 穿仓警告',
                color: '#ff4d4f', // 红色
                bg: 'rgba(255, 77, 79, 0.1)',
                canAction: false,
                desc: `资金缺口 ￥${Math.abs(available).toLocaleString()}，严禁开启新任务！`
            };
        } 
        // 临界黄色状态：Caution
        else if (usageRate > 85 || available < 50000) {
            status = {
                level: 'CAUTION',
                label: '⚠️ 建议补位',
                color: '#ffb400', // 橙黄色
                bg: 'rgba(255, 180, 0, 0.1)',
                canAction: true,
                desc: "水位临界，建议调拨备用金以防穿仓。"
            };
        }

        return {
            available,
            usageRate: usageRate.toFixed(1),
            ...status
        };
    }
};