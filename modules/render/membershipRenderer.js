// modules/render/membershipRenderer.js
export const MembershipRenderer = {
    // 渲染“大门”：预览 + 解锁按钮
    renderAccessGate() {
        const root = document.getElementById('membership-root');
        if (!root) return;

        // 只有非会员才渲染这个“黑匣子”
        root.innerHTML = `
            <div id="access-gate-modal" class="modal-overlay" style="display: flex;">
                <div class="access-gate-box" style="background: #000; border: 1px solid #333; padding: 25px; width: 90%; max-width: 400px; border-radius: 12px; position: relative;">
                    <div style="font-size: 10px; color: #ffb400; letter-spacing: 2px; margin-bottom: 20px;">SYSTEM RESTRICTED</div>
                    
                    <div style="filter: blur(8px); opacity: 0.3; pointer-events: none; margin-bottom: 30px;">
                        <div style="height: 20px; background: #222; width: 60%; mb-10"></div>
                        <div style="height: 100px; background: #111; border: 1px solid #333; margin: 15px 0;"></div>
                        <div style="height: 20px; background: #222; width: 80%;"></div>
                    </div>

                    <div style="text-align: center;">
                        <h3 style="color: #fff; margin-bottom: 10px;">解锁“老手判断”指挥模块</h3>
                        <p style="color: #666; font-size: 13px; line-height: 1.6; margin-bottom: 25px;">
                            此模块包含实时资金水位、跨月利息黑洞预判及全局战术画像校准。
                        </p>
                        <div style="display: flex; gap: 10px;">
                            <button id="gate-cancel" style="flex: 1; padding: 12px; background: #1a1a1a; color: #666; border: none; border-radius: 6px;">离开</button>
                            <button id="gate-unlock" style="flex: 2; padding: 12px; background: #ffb400; color: #000; font-weight: bold; border: none; border-radius: 6px;">验证密钥解锁</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 绑定事件
        document.getElementById('gate-cancel').onclick = () => {
            document.getElementById('access-gate-modal').style.display = 'none';
        };
        document.getElementById('gate-unlock').onclick = () => {
            // 关键：关掉预览门，打开邀请码输入框
            document.getElementById('access-gate-modal').style.display = 'none';
            if (window.MembershipManager) window.MembershipManager.openInviteModal();
        };
    }
};