import { genAgentReason } from '../utils/agentReasonUtils.js';
import { getCycleKey } from '../utils/resetUtils.js';
import { TimeUtils } from '../utils/timeUtils.js';

export const TaskProcessor = {

    checkIsCompleted(task, statuses) {
        if (!Array.isArray(statuses)) return false;

        const rule = task.reset_rule || 'DailyReset';
        const currentCycleKey = getCycleKey(rule);

        return statuses.some(r =>
            String(r.task_id) === String(task.id) &&
            String(r.cycle_key) === String(currentCycleKey)
        );
    },


    calcUrgency(task) {

        let successHint = "";
        let urgencyLevel = "normal";

        if (task.valid_to) {
            const daysLeft = TimeUtils.calcDaysLeft(task.valid_to);

            if (daysLeft <= 1) {
                successHint = "⏰临近截止";
                urgencyLevel = "today";
            }
            else if (daysLeft <= 3) {
                successHint = "⏰接近截止";
                urgencyLevel = "soon";
            }
        }

        if (!successHint) {
            if (task.success_probability >= 0.95)
                successHint = "👥成功路径明确";
            else if (task.is_high_value)
                successHint = "⚖️投入产出优";
        }

        return { successHint, urgencyLevel };
    },


    decorate(task, statuses, skippedIds, ongoingIds) {

        const { successHint, urgencyLevel } = this.calcUrgency(task);

        const dbCompleted = this.checkIsCompleted(task, statuses);

        const dbSkipped =
            skippedIds instanceof Set
                ? skippedIds.has(task.id)
                : (Array.isArray(skippedIds) && skippedIds.includes(task.id));

        return {
            ...task,

            link: task.deep_link,

            agent_need_voice:
                (task.voice_steps && task.voice_steps.length > 0),

            agent_priority:
                task.urgency || 0,

            agent_open_mode:
                (task.title.includes('视频') || task.title.includes('看'))
                    ? 'video'
                    : 'normal',

            agent_base_score:
                task.agent_base_score || 0,

            agent_reason:
                genAgentReason(task),

            agent_success_hint:
                successHint,

            agent_urgency_level:
                urgencyLevel,

            estimated_time:
                task.estimated_time,

            isCompleted:
                dbCompleted,

            isOngoing:
                (ongoingIds || []).includes(String(task.id)),

            isSkipped:
                dbSkipped
        };
    }

};