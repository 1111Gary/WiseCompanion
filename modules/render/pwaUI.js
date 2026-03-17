import { PWAEngine } from '../engines/pwaEngine.js';
export const PWAUI = {
    /**
     * 初始化安装指南框架
     */
    renderGuide() {
        const root = document.getElementById('pwa-guide-root');
        if (!root) return;

        root.innerHTML = `
            <div id="install-guide-modal" class="modal-overlay" style="display: none;">
                <div class="guide-content pp-glass-effect">
                    <div class="guide-header">
                        <h3>添加到桌面</h3>
                        <button class="close-btn" id="pwa-close-x">&times;</button>
                    </div>

                    <div class="guide-body">
                        <p class="guide-intro">获得更完整、沉浸的决策辅助体验，建议添加至主屏幕。</p>

                        <div id="guide-wechat" class="guide-step wechat-warning" style="display:none;">
                            <p>⚠️ <strong>微信限制提示</strong></p>
                            <p>请点击右上角 <strong>•••</strong> 选择“在浏览器打开”，随后进行添加。</p>
                        </div>

                        <div class="guide-step">
                            <h4> iOS (Safari)</h4>
                            <ol>
                                <li>点击底部 ${this._getShareIcon()} 分享按钮</li>
                                <li>上滑选择 <strong>“添加到主屏幕”</strong></li>
                            </ol>
                        </div>

                        <div class="guide-step">
                            <h4>🤖 Android</h4>
                            <ol>
                                <li>点击右上角 <strong>•••</strong> 菜单</li>
                                <li>选择 <strong>“安装应用”</strong> 或 <strong>“添加到主屏幕”</strong></li>
                            </ol>
                        </div>
                    </div>

                    <button class="i-got-it-btn" id="pwa-got-it">知道了</button>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    _getShareIcon() {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>`;
    },

    bindEvents() {
        const closeBtns = ['pwa-close-x', 'pwa-got-it'];
        closeBtns.forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => this.toggle(false));
        });
    },

    toggle(show) {
        const modal = document.getElementById('install-guide-modal');
        if (modal) modal.style.display = show ? 'flex' : 'none';
    }
};

export function initPWAUI() {
    PWAUI.renderGuide();
    const installBtn = document.getElementById('pwa-install-btn');
    const guideModal = document.getElementById('install-guide-modal');

    PWAEngine.initBeforeInstallPrompt(() => {
        if (installBtn) installBtn.style.display = 'inline-flex';
    });

    if (installBtn) {
        installBtn.onclick = async () => {

            const installed = await PWAEngine.triggerInstall();

            if (installed) {
                // 如果用户同意安装，隐藏按钮
                installBtn.style.display = 'none';
            } else {
                // 如果环境不支持（如微信）或用户取消
                if (guideModal) {
                    guideModal.style.display = 'flex';
                    if (PWAEngine.isWeChat()) {
                        const wechatGuide = document.getElementById('guide-wechat');
                        if (wechatGuide) wechatGuide.style.display = 'block';
                    }
                }
                // 💡 重点：如果只是用户取消了，不要立刻隐藏 installBtn，
                // 除非你确定此时无法再次触发安装。
            }

            installBtn.style.display = 'none';
        };
    }

    if (guideModal) {
        guideModal.addEventListener('click', (e) => {
            if (e.target === guideModal) {
                guideModal.style.display = 'none';
            }
        });
    }
}