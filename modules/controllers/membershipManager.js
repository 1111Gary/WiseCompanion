//modules/controllers/membershipManager.js
const INVITE_CODES = {
    'VIP498': { label: '核心体验会员', expires: '2026-12-31' },
    'FOUNDING2026': { label: '内测会员', expires: '2026-06-30' }
};

export const MembershipManager = {
    // 1. 初始化
    init() {
        // 从本地存储读取状态
        window.IS_MEMBER = localStorage.getItem('IS_MEMBER') === 'true';
        
        // 动态画出 HTML 结构
        this.renderModal();
        // 绑定事件监听
        this.bindEvents();
    },

    // 2. 动态渲染 (将 HTML 从 index.html 搬家到这里)
    renderModal() {
        const root = document.getElementById('membership-root');
        if (!root) return;

        root.innerHTML = `
            <div id="invite-modal" class="modal-overlay" style="display: none;">
                <div class="invite-box">
                    <div class="invite-title">解锁专家判断</div>
                    <div class="invite-desc">
                        请输入访问密钥以查看“老手判断”数据。此操作将解锁包含风险评估与判断结论建议的完整报告。
                    </div>

                    <input id="invite-code-input" class="invite-input" placeholder="输入密钥..." type="text" autocomplete="off" />

                    <div class="invite-actions">
                        <button id="invite-cancel-btn" class="btn-cancel">取消</button>
                        <button id="invite-confirm-btn" class="btn-confirm">验证并解锁</button>
                    </div>
                </div>
            </div>
        `;
    },

    // 3. 事件绑定 (不再使用 HTML 里的 onclick)
    bindEvents() {
        document.getElementById('invite-cancel-btn')?.addEventListener('click', () => this.closeInviteModal());
        document.getElementById('invite-confirm-btn')?.addEventListener('click', () => this.submitInviteCode());
        
        // 增加回车键支持，体验更好
        document.getElementById('invite-code-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitInviteCode();
        });
    },

    // 4. 核心逻辑 (保留你原来的验证代码)
    isMember() {
        return !!window.IS_MEMBER;
    },

    activateInviteCode(code) {
        const invite = INVITE_CODES[code.trim()];

        if (!invite) {
            alert('邀请码无效');
            return false;
        }

        if (invite.expires && new Date() > new Date(invite.expires)) {
            alert('邀请码已过期');
            return false;
        }

        localStorage.setItem('IS_MEMBER', 'true');
        localStorage.setItem('MEMBER_CODE', code);
        window.IS_MEMBER = true;

        alert(`✅ ${invite.label} 解锁成功！`);
        return true;
    },

    // 5. 弹窗控制
    openInviteModal() {
        // 如果有其他引导页，先关掉
        const guide = document.getElementById('guide-modal');
        if (guide) guide.style.display = 'none';
        
        const modal = document.getElementById('invite-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // 自动聚焦到输入框
            setTimeout(() => document.getElementById('invite-code-input')?.focus(), 100);
        }
    },

    closeInviteModal() {
        const modal = document.getElementById('invite-modal');
        if (modal) modal.style.display = 'none';
    },

    submitInviteCode() {
        const input = document.getElementById('invite-code-input');
        if (!input) return;

        const code = input.value.trim();
        if (!code) {
            alert('请输入邀请码');
            return;
        }

        const success = this.activateInviteCode(code);
        if (success) {
            this.closeInviteModal();
            // 如果你不想 reload，可以调用 RenderEngine.refresh() 局部刷新
            location.reload(); 
        }
    },

    checkFeatureAccess(levelRequired) {
    const currentLevel = window.IS_MEMBER ? MEMBER_LEVEL.PRO : MEMBER_LEVEL.GUEST;
    if (currentLevel < levelRequired) {
        this.openInviteModal(); // 自动勾引用户输入密钥
        return false;
    }
    return true;
}

};