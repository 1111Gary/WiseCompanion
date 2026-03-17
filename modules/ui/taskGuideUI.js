export const TaskGuideUI = {

    render(t, mode = 'normal') {

        document.getElementById('modal-title').innerText = t.title;
        const box = document.getElementById('step-list-container');
        box.innerHTML = '';

        if (mode === 'pro') {
            this.renderProMode(t, box);
        } else {
            this.renderNormalMode(t, box);
        }

        document.getElementById('guide-modal').style.display = 'flex';
    },

    renderProMode(t, box) {

        if (!window.IS_MEMBER) {
            box.innerHTML = `
                <div class="member-lock-box">
                                <div style="font-size: 36px; margin-bottom: 16px; opacity: 0.8;">🔒</div>
                                <div class="member-lock-title">老手判断（会员专属）</div>
                                <div class="member-lock-desc">
                                    <p style="margin: 0 0 10px 0;">用于判断是否值得投入时间与精力<strong>判断型结论</strong>。</p>
                                    <div style="display: flex; flex-direction: column; gap: 6px;">
                                        <div>⚖️ <strong>判断：</strong> 真实收益与投入产出比</div>
                                        <div>⚠️ <strong>风险：</strong> 普通人容易踩的隐形坑</div>
                                        <div>🚀 <strong>行动：</strong> 现在的最佳切入姿势</div>
                                    </div>
                                </div>
                                <button class="invite-btn" onclick="MembershipManager.openInviteModal()">👉 解锁判断视角</button>
                            </div>`;
                        document.getElementById('guide-modal').style.display = 'flex';
            return;
        }
        if (!Array.isArray(t.agent_pro_tip_steps) || t.agent_pro_tip_steps.length === 0) {
                        box.innerHTML = `<div class="pro-empty-state"><div style="font-size: 40px; margin-bottom: 12px; filter: grayscale(1);">⏳</div><div style="font-size: 14px;">本活动暂未产出老手判断结论</div></div>`;
                        document.getElementById('guide-modal').style.display = 'flex';
                        return;
                    }
                    const verdict = t.agent_pro_tip_steps.find(x => x.type === 'verdict');
                    const risk = t.agent_pro_tip_steps.find(x => x.type === 'risk');
                    const action = t.agent_pro_tip_steps.find(x => x.type === 'action');
                    box.innerHTML = `
                        <div class="pro-judge-wrapper">
                            <div class="pro-judge-header">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 18px;">🧐</span>
                                    <span style="color: var(--text-primary); font-size: 16px;">老手判断 · 判断结果</span>
                                </div>
                                <span style="font-size: 10px; color: var(--color-gold); border: 1px solid var(--color-gold); padding: 2px 6px; border-radius: 4px; opacity: 0.8;">PRO</span>
                            </div>
                            <div class="pro-judge-content">
                                ${verdict ? `<div class="pro-judge-section verdict"><div class="pro-judge-section-title">🧠 判断结论</div><div class="content">${verdict.text}</div></div>` : ''}
                                ${risk ? `<div class="pro-judge-section risk"><div class="pro-judge-section-title">⚠️ 风险与限制</div><div class="content">${risk.text}</div></div>` : ''}
                                ${action ? `<div class="pro-judge-section action"><div class="pro-judge-section-title">🚀 行动建议</div><div class="content">${action.text}</div></div>` : ''}
                            </div>
                        </div>`;
                    document.getElementById('guide-modal').style.display = 'flex';
                    return;

        // 原来的 pro 逻辑先搬过来，不升级
    },

    renderNormalMode(t, box) {

        let steps = Array.isArray(t.agent_steps_json)
            ? t.agent_steps_json
            : [{ text: t.voice_steps }];

        steps.forEach(s => {

            const div = document.createElement('div');
            div.className = 'step-item';
            div.innerText = s.text || s.description;

            div.onclick = () => {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(s.text);
                window.speechSynthesis.speak(u);
            };

            box.appendChild(div);

        });
    },

    close() {
        window.speechSynthesis.cancel();
        document.getElementById('guide-modal').style.display = 'none';
    }

};