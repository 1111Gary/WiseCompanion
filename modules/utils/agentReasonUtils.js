export function genAgentReason(t) {

    if (t.agent_reason_short) return t.agent_reason_short;

    if (t.agent_risk_level >= 2)
        return "存在一定门槛，建议按指引谨慎操作";

    if (t.reset_rule === 'NoReset')
        return "一次性活动，完成后无需反复操作";

    if (t.reset_rule === 'DailyReset' && t.estimated_time <= 2)
        return "日常顺手型活动，耗时很低";

    if (t.reset_rule === 'MonthlyReset' && t.urgency <= 2)
        return "周期较长，可分散时间完成";

    if (t.is_high_value && t.success_probability >= 0.85)
        return "收益确定性较高，值得优先考虑";

    return "整体流程清晰，按步骤完成即可";
}