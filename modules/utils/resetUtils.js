// modules/utils/resetUtils.js

export function getCycleEndTime(task) {

    const now = new Date();

    switch (task.reset_rule) {

        case 'DailyReset': {
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            return end;
        }

        case 'WeeklyReset': {
            const end = new Date(now);
            const day = end.getDay();
            const diff = day === 0 ? 0 : 7 - day;
            end.setDate(end.getDate() + diff);
            end.setHours(23, 59, 59, 999);
            return end;
        }

        case 'MonthlyReset':
            return new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0,
                23, 59, 59, 999
            );

        case 'NoReset':
        default:
            return new Date('2999-12-31');
    }
}


// 周期函数

export function getCycleKey(resetRule, dateObj = new Date()) {

    const rule = (resetRule || '').trim();

    const d = new Date(dateObj);
    d.setUTCHours(0, 0, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    if (rule === 'NoReset') {
        return 'PERMANENT_RECORD';
    }

    if (rule === 'MonthlyReset') {
        return `${year}-${month}`;
    }

    if (rule === 'WeeklyReset') {
        const jsDay = d.getDay();
        const diff = jsDay === 0 ? -6 : 1 - jsDay;

        const monday = new Date(d);
        monday.setDate(d.getDate() + diff);

        const mYear = monday.getFullYear();
        const mMonth = String(monday.getMonth() + 1).padStart(2, '0');
        const mDay = String(monday.getDate()).padStart(2, '0');

        return `${mYear}-${mMonth}-${mDay}`;
    }

    return `${year}-${month}-${day}`;
}