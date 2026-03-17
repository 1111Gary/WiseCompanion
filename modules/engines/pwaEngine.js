export const PWAEngine = {

    deferredPrompt: null,

    isWeChat() {
        return /MicroMessenger/i.test(navigator.userAgent);
    },

    initBeforeInstallPrompt(callback) {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            if (callback) callback();
        });
    },

    async triggerInstall() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            // 等待用户选择
            const { outcome } = await this.deferredPrompt.userChoice;
            this.deferredPrompt = null;
            return outcome === 'accepted'; // 返回 true (已安装) 或 false (已拒绝)
        }
        return false; // 没有安装提示，通常需要弹出手动引导（如微信）
    }

};