// modules/render/countdownRenderer.js// ===== 倒计时（15:00 / 00:00） =====pro plus

export function startCountdown() {

    const el = document.querySelector('.pp-countdown');
    if (!el) return;

    setInterval(() => {

        const now = new Date();

        const today15 = new Date();
        today15.setHours(15, 0, 0, 0);

        const nextMidnight = new Date();
        nextMidnight.setHours(24, 0, 0, 0);

        let target = now < today15 ? today15 : nextMidnight;

        let diff = Math.max(0, target - now);

        const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const m = String(Math.floor(diff % 3600000 / 60000)).padStart(2, '0');
        const s = String(Math.floor(diff % 60000 / 1000)).padStart(2, '0');

        el.textContent =
            `NEXT ${target === today15 ? '15:00' : '00:00'}  ${h}:${m}:${s}`;

    }, 1000);
}