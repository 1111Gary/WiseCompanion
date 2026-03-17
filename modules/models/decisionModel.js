export function buildDecisionModel(activity) {
    if (!activity) return null;

    return {
        id: activity.id,
        title: activity.title,
        reward: activity.reward,
        link: activity.link,

        // 判断结构
        archetype: activity.judgement_archetype,
        judgement: activity.agent_core_judgement,
        proTip: activity.agent_pro_tip_steps,
        comboHint: activity.agent_combo_hint,
        pitfall: activity.agent_pitfall,

        // 内部字段（后面做权限过滤）
        notes: activity.agent_notes
    };
}