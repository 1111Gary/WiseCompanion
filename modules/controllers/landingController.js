import { getCycleKey } from '../utils/resetUtils.js';

export const LandingController = {

    lsKey: 'nex_landing_last_shown_date',
    sessionKey: 'nex_landing_session_checked',

    getToday() {
        return getCycleKey('DailyReset');
    },

    init() {
        if (sessionStorage.getItem(this.sessionKey)) return false;

        sessionStorage.setItem(this.sessionKey, 'true');

        if (localStorage.getItem(this.lsKey) !== this.getToday()) {

            const overlay = document.getElementById('landing-overlay');

            if (overlay) {
                overlay.style.display = 'flex';
                overlay.style.opacity = '1';
            }

            return true;
        }

        return false;
    },
    bindEvents() {
        const btn = document.getElementById('landing-enter-btn');
        if (btn) {
            btn.addEventListener('click', () => this.enterApp());
        }
    },

    enterApp() {

        localStorage.setItem(this.lsKey, this.getToday());

        const overlay = document.getElementById('landing-overlay');
        if (!overlay) return;

        overlay.style.opacity = '0';

        setTimeout(() => {
            overlay.style.display = 'none';
            const pendingText = document.getElementById('greeting-text')?.innerText;

            // 💡 改进：增加对 RenderEngine 的安全访问
            const engine = window.RenderEngine;
            if (engine && typeof engine.tryPlayGreeting === 'function') {
                if (pendingText && pendingText !== '...') {
                    engine.tryPlayGreeting(pendingText);
                }
            }
        }, 450);
    },

    isShowing() {
        const el = document.getElementById('landing-overlay');
        return el &&
            el.style.display !== 'none' &&
            el.style.opacity !== '0';
    }

};
window.LandingController = LandingController;