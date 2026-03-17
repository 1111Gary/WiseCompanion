export const ProJudgementBlock = {

    render(t, isMember) {

        if (!isMember) {
            return `
                <div class="member-lock-box">
                    <div style="font-size: 36px; margin-bottom: 16px; opacity: 0.8;">🔒</div>
                    <div class="member-lock-title">老手判断（会员专属）</div>
                    <div class="member-lock-desc">
                        <p style="margin: 0 0 10px 0;">
                            用于判断是否值得投入时间与精力的判断型结论。
                        </p>
                        <div style="display:flex;flex-direction:column;gap:6px;">
                            <div>⚖️ <strong>判断：</strong> 投入产出比</div>
                            <div>⚠️ <strong>风险：</strong> 隐形坑</div>
                            <div>🚀 <strong>行动：</strong> 最佳切入姿势</div>
                        </div>
                    </div>
                    <button class="invite-btn" onclick="MembershipManager.openInviteModal()">
                        👉 解锁判断视角
                    </button>
                </div>
            `;
        }

        if (!Array.isArray(t.proTip) || t.proTip.length === 0) {
            return `
                <div class="pro-empty-state">
                    <div style="font-size:40px;margin-bottom:12px;filter:grayscale(1);">⏳</div>
                    <div style="font-size:14px;">暂未产出老手判断结论</div>
                </div>
            `;
        }

        const verdict = t.proTip.find(x => x.type === 'verdict');
        const risk = t.proTip.find(x => x.type === 'risk');
        const action = t.proTip.find(x => x.type === 'action');

        return `
            <div class="pro-judge-wrapper">

                <div class="pro-judge-header">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:18px;">🧐</span>
                        <span style="color:var(--text-primary);font-size:16px;">
                            老手判断 · 判断结果
                        </span>
                    </div>
                    <span class="pro-tag">PRO</span>
                </div>

                <div class="pro-judge-content">

                    ${verdict ? `
                        <div class="pro-judge-section verdict">
                            <div class="pro-judge-section-title">
                                🧠 判断结论
                            </div>
                            <div class="content">
                                ${verdict.text}
                            </div>
                        </div>` : ''}

                    ${risk ? `
                        <div class="pro-judge-section risk">
                            <div class="pro-judge-section-title">
                                ⚠️ 风险与限制
                            </div>
                            <div class="content">
                                ${risk.text}
                            </div>
                        </div>` : ''}

                    ${action ? `
                        <div class="pro-judge-section action">
                            <div class="pro-judge-section-title">
                                🚀 行动建议
                            </div>
                            <div class="content">
                                ${action.text}
                            </div>
                        </div>` : ''}

                </div>

            </div>
        `;
    }

};