// modules\utils\timeUtils.js
export const TimeUtils = {
    // 1. 统一判断是否为深夜（19点到凌晨6点）
    isNight() {
        const hour = new Date().getHours();
        return hour >= 19 || hour < 6;
    },

    // 2. 统一获取问候前缀（上午、下午等）
    getGreetingPrefix() {
        const hour = new Date().getHours();
        if (hour < 6) return "凌晨好";
        if (hour < 11) return "上午好";
        if (hour < 14) return "中午好";
        if (hour < 18) return "下午好";
        return "晚上好";
    },
    // 🔴 搬家过来的计算逻辑
    calcDaysLeft(validTo) {
        if (!validTo) return 0;
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const end = new Date(validTo);
        const endStart = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        return Math.floor((endStart - todayStart) / (1000 * 60 * 60 * 24));
    },
    // 4. 新加入的：获取本地日期 Key (从 dateUtils 搬家过来)
    getLocalDateKey() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    },

    // 5. 额外赠送：获取当前年份月份（用于像 2026-03 这样的 cycle_key）
    getYearMonthKey() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    },

    // 🔴 降级战术：静态记录 2026 主要利息黑洞（春节、国庆等）
    // 格式：'MM-DD'
    HOLIDAY_BLACK_HOLES: [
        '02-13', '02-14', '02-15', '02-16', '02-17', '02-18', '02-19', // 春节
        '04-04', '04-05', '04-06', // 清明
        '05-01', '05-02', '05-03', // 五一
        '10-01', '10-02', '10-03', '10-04', '10-05', '10-06', '10-07'  // 国庆
    ],

    isInterestDeadZone(date) {
        if (!date || !(date instanceof Date)) return false;
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const md = `${month}-${day}`;
        
        // 周六周日也是利息损耗区（部分产品 T+0 排除外）
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isLongHoliday = this.HOLIDAY_BLACK_HOLES.includes(md);
        
        return isLongHoliday || isWeekend;
    }
};
