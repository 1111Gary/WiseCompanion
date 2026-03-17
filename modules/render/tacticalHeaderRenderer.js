// modules/render/tacticalHeaderRenderer.js

export function renderTacticalHeader(containerId, engineData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 严密逻辑：如果引擎还没跑出数据，显示加载态
    if (!engineData) {
        container.innerHTML = `<div class="tactical-loading">精算引擎初始化中...</div>`;
        return;
    }

    const { stage, completion, dsm, requiredDaily, mode, ssi, survivalFlag } = engineData;

    // 状态映射：将 mode 转换为高端的战术文案
    const modeMeta = {
        'stable': { label: '态势稳健', color: '#52c41a', bg: 'rgba(82, 196, 26, 0.1)' },
        'recovery_soft': { label: '柔性追赶', color: '#ffb400', bg: 'rgba(255, 180, 0, 0.1)' },
        'recovery_hard': { label: '紧急加码', color: '#ff4d4f', bg: 'rgba(255, 77, 79, 0.1)' },
        'decision_required': { label: '决策介入', color: '#722ed1', bg: 'rgba(114, 46, 209, 0.1)' }
    };

    const currentMode = modeMeta[mode] || modeMeta['stable'];

    container.innerHTML = `
        <div class="tactical-header">
            <div class="t-status-row">
                <div class="t-ssi-box">
                    <svg viewBox="0 0 36 36" class="circular-chart">
                        <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="circle" stroke-dasharray="${ssi}, 100}" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <text x="18" y="20.35" class="percentage">${ssi}%</text>
                    </svg>
                    <div class="t-ssi-label">稳定性 SSI</div>
                </div>
                <div class="t-mode-badge" style="color: ${currentMode.color}; background: ${currentMode.bg}">
                    <span class="pulse-dot" style="background: ${currentMode.color}"></span>
                    ${currentMode.label}
                </div>
            </div>

            <div class="t-command-card">
                <div class="t-command-label">
                    <span>今日资产必达成指令 (CNY)</span>
                    <span class="t-stage-pill">${stage} 阶段</span>
                </div>
                <div class="t-command-value" id="count-up-value">
                    ${requiredDaily.toLocaleString()}
                </div>
                <div class="t-command-footer">
                    <span>完成进度: ${completion}</span>
                    <span>决策压力 (DSM): ${dsm}</span>
                </div>
            </div>

            <div class="t-hook-bar" onclick="MembershipManager.openInviteModal()">
                <div class="t-hook-text">
                    <i class="fas fa-shield-halved"></i>
                    离岸资产对比模型已就绪，预计提升利差 1.2%
                </div>
                <i class="fas fa-chevron-right"></i>
            </div>
        </div>
    `;
    
    // 逻辑：如果生存旗帜亮起，强制改变 UI 颜色
    if (survivalFlag) {
        document.querySelector('.tactical-header').classList.add('emergency-mode');
    }
}