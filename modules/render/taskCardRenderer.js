// modules\render\taskCardRenderer.js
export const TaskCardRenderer = {
    renderList(type, tasks) {
        const container = document.getElementById(`${type}-list`) || document.getElementById(`${type}-container`);
        const section = document.getElementById(`${type}-section`);
        if (!container || !section) return;

        if (tasks.length === 0) {
            if (type === 'ongoing') section.style.display = 'none';
            else container.innerHTML = '<div class="text-center py-10 text-sm text-gray-500 leading-relaxed">✓ 今日适合完成的任务已全部处理<br>✓ 系统将在有新任务时自动展示</div>';
            return;
        }
        if (type === 'ongoing') section.style.display = 'block';
        // ... (复制你原本 renderSection 里的空状态处理、display: block/none 逻辑)
        container.innerHTML = tasks.map(t => this.createCard(t, type)).join('');
    },

    createCard(t, type) {
        const isOngoing = type === 'ongoing';
        const isVideo = type === 'video';

        const isRec = type === 'recommend';
        let badge = isVideo ? '视频' : (isOngoing ? '进行中' : '精选');
        let badgeClass = isVideo ? 'video' : (isOngoing ? 'ongoing' : 'today');
        let hintHtml = `<div class="hint-tag hint-decision">🧠 ${t.agent_reason_short || ''}</div>`;
        if (isRec) hintHtml += `<div class="hint-tag hint-success">✅ ${t.agent_success_hint}</div>`;

        const isMemberEnv = typeof IS_MEMBER !== 'undefined' ? IS_MEMBER : false;

        // 严格遵循原有逻辑与要求，仅作模块化拆分拼接
        const agentJudgement = (t.agent_combo_hint || t.agent_core_judgement || t.agent_suitable_user)
            ? `<div class="agent-judgement">
                ${t.agent_combo_hint ? (isMemberEnv === true ? `<div class="agent-core">🧠 ${t.agent_combo_hint}</div>` : `<div class="agent-core locked">🧠 高阶组合判断（会员解锁 · 放大收益用）</div>`) : ''}
                ${(!t.agent_combo_hint && t.agent_core_judgement) ? `<div class="agent-core">🧠 ${t.agent_core_judgement}</div>` : ''}
                ${t.agent_suitable_user ? `<div class="agent-user">👤 适合人群：${t.agent_suitable_user}</div>` : ''}
               </div>`
            : '';

        const executionBlock = (t.agent_reward_desc || t.agent_deadline || t.agent_time_cost)
            ? `<div class="agent-expand"><div class="agent-expand-toggle" onclick="this.nextElementSibling.classList.toggle('open')"><i class="fas fa-chevron-right text-xs"></i> 投入与回报</div><div class="agent-expand-body">${t.agent_reward_desc ? `<div>🎁 奖励：${t.agent_reward_desc}</div>` : ''}${t.agent_deadline ? `<div>⏰ 时效：${t.agent_deadline}</div>` : ''}${t.agent_time_cost ? `<div>⏱ 成本：${t.agent_time_cost}</div>` : ''}</div></div>` : '';

        const riskBlock = (t.agent_pitfall || t.agent_pro_tip)
            ? `<div class="agent-expand secondary"><div class="agent-expand-toggle" onclick="this.nextElementSibling.classList.toggle('open')"><i class="fas fa-chevron-right text-xs"></i> 可能踩坑的地方</div><div class="agent-expand-body">${t.agent_pitfall ? `<div>⚠️ 注意：${t.agent_pitfall}</div>` : ''}${t.agent_pro_tip ? `<div class="member-entry" onclick="TaskController.openGuide(window.ALL_TASKS.find(t => t.id === '${t.id}'), 'pro')">💡 老手判断</div>` : ''}</div></div>` : '';

        let proTacticalHtml = '';
        if (isOngoing && isMemberEnv && (t.title.includes('提升') || t.title.includes('资产'))) {
            // 逻辑：如果数据库有配置就用数据库的，没有就用默认 1/5/10/50
            let tiers = [10000, 50000, 100000, 500000];
            if (t.tier_config) {
                try {
                    // 如果 tier_config 是字符串，先解析它
                    const config = typeof t.tier_config === 'string' ? JSON.parse(t.tier_config) : t.tier_config;
                    // 提取其中的 min 值作为按钮数字
                    tiers = config.map(item => item.min);
                } catch (e) {
                    console.error("解析挡位配置失败:", e);
                }
            }
            proTacticalHtml = `
                <div class="pro-tactical-zone" style="margin: 8px 0; padding: 8px; background: rgba(255,180,0,0.03); border: 1px dashed rgba(255,180,0,0.2); border-radius: 6px;">
                    <div style="font-size: 9px; color: #ffb400; margin-bottom: 6px; display: flex; justify-content: space-between; letter-spacing: 0.5px;">
                        <span>🛡️ NEX-AI 战术攻击挡位 (根据规则动态生成)</span>
                        <span style="opacity: 0.8;">PRO ONLY</span>
                    </div>
                    <div style="display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none;">
                        ${tiers.map(tier => `
                            <button onclick="TaskController.activateTacticalX('${t.id}', ${tier})" 
                                class="pp-tier-btn"
                                style="flex: 1; height: 22px; font-size: 10px; background: #1a1a1a; border: 1px solid #333; color: #aaa; border-radius: 3px; cursor: pointer; white-space: nowrap;">
                                ${tier >= 10000 ? (tier/10000) + '万' : tier}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        const activeTierDisplay = t.selected_tier
            ? `<span style="color:#ffb400; font-weight:bold;"><i class="fas fa-crosshairs"></i> 锁定 ${(t.selected_tier / 10000)}万</span>`
            : `<i class="far fa-clock"></i> ${t.estimated_time || 4}m`;

        let buttonsHtml = '';
        if (isVideo) buttonsHtml = `<button class="action-chip" onclick="TaskController.openVideo('${t.link}')">▶ 浏览内容</button>`;
        else if (isOngoing) buttonsHtml = `<button onclick="TaskController.complete('${t.id}')" class="btn-secondary">本期已处理</button><button onclick="TaskController.skipToday('${t.id}')" class="btn-tertiary">暂不处理</button><button onclick="TaskController.continueTask('${t.id}')" class="action-chip">继续处理 <i class="fas fa-arrow-right ml-1 text-xs"></i></button>`;
        else buttonsHtml = `<button class="action-chip" onclick="TaskController.start('${t.id}', '${t.link}')">${t.link ? '🔗 查看指引' : '🔊 查看指引'}</button>`;

        const timeHtml = t.estimated_time ? `<i class="far fa-clock"></i> ${t.estimated_time}m` : '';

        return `
            <div class="task-card ${isOngoing ? 'ongoing-style' : ''}">
                <div class="rec-badge ${badgeClass}">${badge}</div>
                <div style="font-weight:600; color:var(--text-primary); font-size:1.1rem; margin-bottom:12px; padding-right:60px;">${t.title}</div>
                <div class="agent-hints">
                    ${agentJudgement}
                    ${executionBlock}
                    ${riskBlock}
                    ${proTacticalHtml} 
                </div>
                <div class="card-footer">
                    <div class="card-footer-left" style="font-size: 11px;">${activeTierDisplay}</div>
                    <div class="card-footer-right">${buttonsHtml}</div>
                </div>
            </div>
        `;
    }



};