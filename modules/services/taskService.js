//modules\services\taskService.js
import { getCycleKey } from "../utils/resetUtils.js";
import { TimeUtils } from '../utils/timeUtils.js';

export const TaskService = {

    async syncComplete(task) {

        const rule = task.reset_rule || 'DailyReset';
        const correctCycleKey = getCycleKey(rule);

        return await window.sbClient
            .from('user_task_status')
            .upsert({
                user_key: window.USER_ID,
                cycle_key: correctCycleKey,
                task_id: task.id,
                status: 'COMPLETED',
                completed_at: new Date().toISOString()
            }, { onConflict: 'user_key,cycle_key,task_id' });

    },

    async syncSkip(id) {
        const TODAY_KEY = TimeUtils.getLocalDateKey();

        return await window.sbClient
            .from('skip_state')
            .upsert(
                {
                    user_key: window.USER_ID,
                    task_id: id,
                    date_key: TODAY_KEY
                },
                {
                    onConflict: 'user_key,task_id,date_key',
                    ignoreDuplicates: true
                }
            );
    },

    async syncTacticalTier(task, tier) {
        if (!window.sbClient) throw new Error("Supabase client not initialized");

        const rule = task.reset_rule || 'MonthlyReset';
        const correctCycleKey = getCycleKey(rule);

        // 🔴 修复逻辑：必须带上 status 字段以满足数据库 NOT NULL 约束
        return await window.sbClient
            .from('user_task_status')
            .upsert({
                user_key: window.USER_ID,
                cycle_key: correctCycleKey,
                task_id: task.id,
                selected_tier: tier,
                attack_status: 'attacking',
                status: 'ONGOING' // 确保 status 字段不为空
            }, { onConflict: 'user_key,cycle_key,task_id' });
    },

    async syncToLedger(task, tier) {
        const today = new Date().toISOString().split('T')[0];
        const endOfMonth = new Date(2026, 2, 31).toISOString().split('T')[0]; // 3月底

        return await window.sbClient
            .from('capital_ledger')
            .upsert({
                user_id: window.USER_ID,
                task_id: task.id,
                source_app: task.source_app || 'Generic',
                capital_locked: tier,
                lock_start_date: today,
                lock_end_date: endOfMonth,
                expected_release_date: endOfMonth, // 🔴 必须补上这个字段
                status: 'active',
                capital_type: 'fixed_lock'
            }, { onConflict: 'user_id,task_id' });
    }
};