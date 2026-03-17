// 统一的深夜 UI 调度中心
import { TimeUtils } from '../utils/timeUtils.js';
export const NightModeController = {
    CONFIG: {
        startHour: 23,
        endHour: 5,
        targetId: 'score-card-wrapper' // 建议指向主容器
    },
    init() {
        this.applyNightMode();
    },

    isNightTime() {
        return TimeUtils.isNight(); // 统一调用工具类，不要自己 new Date()
    },

    applyNightMode() {
        const isNight = this.isNightTime();
        
        // 1. 顶部状态同步 (整合原 applyNightModeUI)
        const agentMsg = document.querySelector('.agent-msg');
        const topHint = document.getElementById('night-hint');
        
        if (isNight) {
            agentMsg?.classList.add('night-judgement');
            if (topHint) {
                topHint.style.display = 'block';
                topHint.classList.add('night-tip-border'); // 增加你喜欢的边框效果
            }
        } else {
            agentMsg?.classList.remove('night-judgement');
            if (topHint) topHint.style.display = 'none';
        }

        // 2. 底部动态内容 (整合原 addNightHumor)
        this.updateBottomWhisper(isNight);
    },

    updateBottomWhisper(isNight) {
        const container = document.getElementById(this.CONFIG.targetId);
        const whisper = document.getElementById('night-whisper');
        
        if (!isNight) {
            if (whisper) whisper.innerHTML = '';
            return;
        }

        if (whisper) {
            // 从统一的池子里取，或者保持现在的彩蛋逻辑
            whisper.innerHTML = "🌙 夜深了，适合轻松处理一些低强度内容。";
            whisper.classList.add('night-tip');
        }
    }
};