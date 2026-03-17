//modules\controllers\taskDataBuilder.js
import { getCycleKey } from "../utils/resetUtils.js";
import { LocalState } from "../services/localState.js";

/* ---------- 关键词自动分类逻辑 ---------- */
function autoCategorize(task) {
    if (task.task_type && ["M1", "M2", "M3"].includes(task.task_type)) {
        return task.task_type;
    }

    const name = task.title || "";
    const desc = task.description || "";
    const content = (name + desc).toLowerCase();

    // M1：升金核心（占资、达标、保级）
    // 关键词：上金、聚惠、月月增、日均、资产提升、达标、私行、金卡
    if (/升金|上金|达标|日均|资产|余额|沉淀|财富|保级|月月增/.test(content)) {
        return "M1";
    }

    // M2：策略调度（流动、磨损、占额度）
    // 关键词：转账、消费、缴费、支付、调度、买入、赎回、理财、申购、立减金
    if (/转账|消费|支付|缴费|买入|赎回|调度|资金往来|理财|申购|立减金/.test(content)) {
        return "M2";
    }

    // M3：无损签到（不占钱、白嫖）
    // 关键词：签到、积分、抽奖、点赞、浏览、助力、任务中心、碳账户、答题
    return "M3";
}

export async function buildTaskData({ sbClient, userId, todayKey }) {

    const pTasks = sbClient.from('tasks_view').select('*');

    const pStatus = sbClient
        .from('user_task_status')
        .select('task_id, cycle_key')
        .eq('user_key', userId)
        .eq('status', 'COMPLETED');

    const pSkipped = sbClient
        .from('skip_state')
        .select('task_id')
        .eq('user_key', userId)
        .eq('date_key', todayKey);

    const [resTasks, resStatus, resSkipped] =
        await Promise.all([pTasks, pStatus, pSkipped]);

    const now = Date.now();

    const tasksRaw = resTasks.data || [];
    const userStatuses = resStatus.data || [];
    const skippedSet = new Set((resSkipped.data || []).map(r => r.task_id));

    const ongoingIds = LocalState.getOngoingIds();

    /* ---------- completed O(1) ---------- */

    const completedSet = new Set(
        userStatuses.map(r => `${r.task_id}_${r.cycle_key}`)
    );

    /* ---------- filter valid ---------- */

    const validTasks = tasksRaw.filter(t => {

        if (t.valid_from && now < new Date(t.valid_from).getTime())
            return false;

        if (t.valid_to) {
            const end = new Date(t.valid_to);

            if (t.valid_to.length === 10)
                end.setHours(23, 59, 59, 999);

            if (now > end.getTime())
                return false;
        }

        return true;
    });

    /* ---------- adapt schema ---------- */
    //const tasks = validTasks.map(TaskAdapter.adapt);
    /* ---------- keep original schema */

    const tasks = validTasks;

    /* ---------- status merge ---------- */

    const structuredTasks = tasks.map(t => {

        const cycleKey = getCycleKey(t.reset_rule);

        const isCompleted =
            completedSet.has(`${t.id}_${cycleKey}`);

            // 🔴 逻辑注入：计算正确的 task_type
        const finalType = autoCategorize(t);

        return {
            ...t,
            task_type: finalType, // 统一口径后的类型
            isCompleted,
            isOngoing: ongoingIds.includes(String(t.id)),
            isSkipped: skippedSet.has(t.id)
        };
    });

    /* ---------- categorize ---------- */

    const videos = [];
    const ongoing = [];
    const recommend = [];

    structuredTasks.forEach(t => {

        if (t.isCompleted) return;

        if (t.agent_open_mode === 'video') {
            videos.push(t);
            return;
        }

        if (t.isOngoing) {
            ongoing.push(t);
            return;
        }

        if (!t.isSkipped) {
            recommend.push(t);
        }

    });

    return {
        tasks: structuredTasks, 
        statuses: userStatuses,
        skippedIds: skippedSet
    };
}