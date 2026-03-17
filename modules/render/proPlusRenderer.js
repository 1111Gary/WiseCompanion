// 【位置：modules/render/proPlusRenderer.js

export const ProPlusRenderer = {
    // 基础结构渲染 (主容器)
    renderStructure() {
        const root = document.getElementById('pro-plus-modal-root');
        if (!root) return;

        root.innerHTML = `
            <div id="pro-plus-modal" class="modal-overlay" style="display: none;">
                <div class="pp-container">
                    <div class="pp-sticky-header">
                        <div class="pp-date-info">
                            <div id="pp-date-main" class="pp-date-main">--.--</div>
                            <div id="pp-date-sub" class="pp-date-sub">NEX-AI TACTICAL</div>
                        </div>
                        <div class="pp-countdown" id="pp-status-tag">AB 轮换中</div>
                    </div>

                    <div class="pp-scroll-body">
                        <div class="pp-tactical-card" id="pp-tactical-config">
                            ${this._getTacticalConfigHTML()}
                        </div>

                        <div id="pp-roi-container" style="margin-bottom: 20px;"></div>

                        <div class="pp-module-title">📅 资金调度日历 (填空游戏)</div>
                        <div class="pp-calendar-container">
                            <div id="pp-calendar-grid" class="pp-calendar-grid"></div>
                            
                            <div id="pp-value-box" style="margin-top: 15px; min-height: 80px; background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px; display: none;">
                                <div style="color: #666; text-align: center; padding-top: 20px;">点击上方日历查看精算详情</div>
                            </div>
                        </div>
                        
                        <div class="pp-module-title">📡 战术意图 & 精算透视</div>
                        <div id="pp-intent-container" class="pp-instruction-card"></div>
                    </div>

                    <button class="pp-close-btn" id="pro-plus-close-btn">同步指令，关闭</button>
                </div>
            </div>
        `;
    },

    // 渲染大钱袋子
    renderROICard(snapshot) {
        const {
            expectedROI = 0,
            rewardPart = 0,
            interestPart = 0,
            ssi = 0
        } = snapshot;

        return `
            <div class="roi-gold-card">
                <div class="roi-label">本月精算预计净收益</div>
                <div class="roi-value">
                    <span class="currency">￥</span>${Number(snapshot.expectedROI).toFixed(2)}
                </div>
                <div style="font-size: 10px; color: rgba(255,180,0,0.8); margin-top: 4px;">
                    奖励 ￥${rewardPart.toLocaleString()} + 货基利息 ￥${interestPart.toFixed(2)}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <div class="roi-tag">精算达成率: ${ssi}%</div>
                </div>
            </div>
        `;
    },
    //战术日历显示
    renderCalendar(timeline, totalFunds = 350000) {
        const grid = document.getElementById('pp-calendar-grid');
        if (!grid || !timeline) return;

        grid.innerHTML = timeline.map(day => {
            // 1. 节假日判断
            const isWeekend = [6, 0].includes(new Date(2026, 2, day.day).getDay());
            
            // 2. 🔴 关键修复：水位高度计算
            // 确保使用传入的 totalFunds，如果 free 是负数，水位撑满并触发 overload 样式
            const isOverload = day.free < 0;
            const waterHeight = isOverload ? 100 : Math.min(100, Math.max(0, (day.free / totalFunds) * 100));
            const waterClass = isOverload ? 'line-w' : 'line-a'; 

            return `
                <div class="calendar-day ${day.isToday ? 'today' : ''} ${isWeekend ? 'holiday-trap' : ''} ${isOverload ? 'overload' : ''}" 
                     onclick="window.ProPlusController.handleDayClick(${day.day})"
                     style="cursor: pointer; position: relative; overflow: hidden;">
                    
                    <span class="day-num ${day.taskCount > 0 ? 'day-active' : ''}" style="position:relative; z-index:3;">${day.day}</span>
                    
                    <div class="water-line ${waterClass}" 
                         style="height: ${waterHeight}%; position:absolute; bottom:0; left:0; width:100%; z-index:1; transition: height 0.4s ease;">
                    </div>
                    
                    <div class="day-status-dot" style="background: ${isOverload ? '#ff4d4f' : (day.taskCount > 0 ? '#52c41a' : '#333')}; z-index: 3;"></div>
                    
                    ${isOverload ? '<div class="day-warning" style="z-index:3; position:absolute; top:2px; right:2px; color:#ff4d4f; font-weight:bold; font-size:10px;">!</div>' : ''}
                </div>
            `;
        }).join('');
    },

    // 渲染战术采样细节 (原本在 Controller 里的 HTML 移到这里)
    renderDayDetailHTML(dayData) {
        const container = document.getElementById('pp-value-box');
        if (!container) return;

        // 逻辑计算
        const isAlert = dayData.free < 0;
        const freeAmount = dayData.free || 0;
        const lockedAmount = dayData.locked || dayData.hardLocked || 0;
        const color = isAlert ? '#ff4d4f' : '#52c41a';
        const bg = isAlert ? 'rgba(255,77,79,0.1)' : 'rgba(82,196,26,0.1)';
        const label = isAlert ? '⚠️ 建议补位' : '✅ 精算平衡';

        // 🔴 合并后的 UI 结构：这就是你要的“光晕合并到日历展示”
        container.style.transition = "all 0.3s ease";
        container.style.background = bg;
        container.style.borderLeft = `4px solid ${color}`;
        container.style.padding = "12px";
        container.style.boxShadow = `0 0 15px ${color}22`;

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-size:13px; font-weight:bold; color:#ffb400;">📅 3月${dayData.day}日 战术采样</span>
                <span style="background:${color}; color:#000; padding:2px 6px; border-radius:3px; font-weight:bold; font-size:10px;">
                    ${label}
                </span>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div>
                    <div style="font-size:10px; color:#888;">实时可用头寸</div>
                    <div style="font-size:16px; color:${isAlert ? '#ff4d4f' : '#fff'}; font-weight:bold; font-family:'Courier New', monospace;">
                        ￥${(dayData.free || 0).toLocaleString()}
                    </div>
                </div>
                <div>
                    <div style="font-size:10px; color:#888;">当前锁仓本金</div>
                    <div style="font-size:16px; color:#00f2ff; font-weight:bold; font-family:'Courier New', monospace;">
                        ￥${(dayData.locked || 0).toLocaleString()}
                    </div>
                </div>
            </div>
            <div style="margin-top:10px; padding-top:8px; border-top:1px dashed rgba(255,255,255,0.1); font-size:11px; color:#ccc;">
                <span style="color:${color}; margin-right:5px;">●</span> 
                ${isAlert ? '水位临界，建议调拨备用金以防穿仓。' : '当前流动性足以支撑战术目标。'}
            </div>
            <div class="energy-bar" style="margin-top: 10px; border-radius: 2px; overflow: hidden; height:4px; background:rgba(255,255,255,0.05);">
                <div class="energy-fill-locked" style="width: ${Math.min(100, ((dayData.locked || 0) / 350000) * 100)}%; height: 100%;"></div>
            </div>
        `;
    },
    //📡 战术意图 & 精算透视
    renderIntent(snapshot) {
        const container = document.getElementById('pp-intent-container');
        if (!container || !snapshot) return;

        // 1. 统一变量命名，防止 undefined
        const ssi = snapshot.ssi || 0;
        const available = snapshot.availableAmount || 0;
        const timeline = snapshot.timeline || [];

        // 设置默认值，防止 undefined 刷屏
        const {
            availableAmount = 0,
            projection = { projectedSSI: 0 },
            resilience = 'AA',
            sbr = 0
        } = snapshot;

        const forecastSSI = (timeline.length > 0 && timeline[timeline.length - 1]?.free >= 0)
            ? ssi
            : (ssi * 0.9).toFixed(1);


        // 动态指令颜色

        const actionColor = availableAmount < 0 ? '#ff4d4f' : (ssi >= 100 ? '#52c41a' : '#00f2ff');
        const actionLabel = availableAmount < 0 ? "🚨 穿仓风险" : (ssi >= 100 ? "资产溢出 (Free)" : "资产补位 (Refill)");

        container.innerHTML = `
            <div class="pp-dual-view">
                <div class="pp-view-left">
                    <div class="pp-sub-label">执行指令 (Execution)</div>
                    <div class="pp-primary-action" style="color: ${actionColor}">${actionLabel}</div>
                    <div class="pp-secondary-info">
                        🛡️ 精算可动资金: <b style="color:${availableAmount < 0 ? '#ff4d4f' : '#fff'}">￥${availableAmount.toLocaleString()}</b>
                    </div>
                </div>
                <div class="pp-view-right">
                    <div class="pp-sub-label">前瞻预判 (Forecast)</div>
                    <div class="pp-primary-forecast" style="color: ${ssi < 100 ? '#ffb400' : '#52c41a'}">
                        ${ssi < 100 ? '⚠️ 存在缺口' : '🛡️ 态势稳健'}
                    </div>
                    <div class="pp-secondary-info">预测月终 SSI: ${ssi}%</div>
                </div>
            </div>
            <div class="pp-resilience-bar">
                <span>系统韧性: <b style="color:#52c41a">${resilience}</b></span>
                <span>本月安全余量: <b style="color:#00f2ff">${sbr}%</b></span>
            </div>
        `;

    },

    renderSampling(snapshot) {
        // 🔴 改为指向新的概览容器，不要覆盖配置表
        const container = document.getElementById('pp-sampling-display-area');
        if (!container) return;

        const risk = snapshot.risk || { color: '#52c41a', label: '✅ 状态正常', bg: 'rgba(82,196,26,0.1)', desc: '精算平衡' };

        // 应用光晕样式到父级卡片
        container.style.transition = "all 0.5s ease";
        container.style.background = risk.bg;
        container.style.borderLeft = `4px solid ${risk.color}`;
        container.style.boxShadow = `0 0 15px ${risk.color}22`;

        container.innerHTML = `
        <div style="padding: 12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:12px; color:#eee; font-weight:bold;">🛡️ 战术画像动态校准</span>
                <span class="pp-risk-badge" style="background:${risk.color}; color:#000; padding:2px 6px; border-radius:3px; font-weight:bold; font-size:10px;">
                    ${risk.label}
                </span>
            </div>
            <div style="margin-top:10px; display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div>
                    <div style="font-size:10px; color:#888;">实时可用头寸</div>
                    <div style="font-size:18px; color:${snapshot.availableAmount < 0 ? '#ff4d4f' : '#fff'}; font-weight:bold; font-family: 'Courier New', monospace;">
                        ￥${(snapshot.availableAmount || 0).toLocaleString()}
                    </div>
                </div>
                <div>
                    <div style="font-size:10px; color:#888;">当前锁仓本金</div>
                    <div style="font-size:18px; color:#00f2ff; font-weight:bold; font-family: 'Courier New', monospace;">
                        ￥${(snapshot.lockedAmount || 0).toLocaleString()}
                    </div>
                </div>
            </div>
            <div style="margin-top:8px; font-size:11px; color:${risk.color};">
                ● ${risk.desc}
            </div>
        </div>`;
    },

    // 内部方法：把那堆复杂的账户输入框抽离出来，保持结构清晰
    _getTacticalConfigHTML() {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="font-weight: 800; color: #ffb400; font-size: 14px;">🛡️ 战术画像校准 (LOCAL)</div>
                <div id="pp-toggle-config" style="font-size: 11px; color: #4a9eff; cursor: pointer; text-decoration: underline;">展开细节配置 ↓</div>
            </div>
            
            <div class="pp-input-group" style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label class="pp-input-label">当前总可用作战资金 (CNY)</label>
                    <span style="font-size: 10px; color: #666;">最后更新: <span id="pp-last-sync">--:--</span></span>
                </div>
                <input type="number" id="pp-local-total" placeholder="输入总资金" class="pp-field-input" style="font-family: 'Courier New', monospace; font-size: 20px; color: #ffb400; background: rgba(0,0,0,0.3);">
            </div>

            <div id="pp-config-drawer" style="display: none; border: 1px dashed #333; padding: 10px; border-radius: 6px; background: rgba(0,0,0,0.2); margin-bottom: 15px;">
                <div class="pp-account-grid" style="display: flex; flex-direction: column; gap: 15px;">
                    ${this._getAccountItemHTML('A', '本人计划', '#4a9eff')}
                    ${this._getAccountItemHTML('B', '家属配合', '#52c41a')}
                </div>
                <button id="pp-sync-trigger" class="pp-sync-btn" style="margin-top: 15px; width: 100%; height: 32px; font-size: 12px;">同步至本地精算引擎</button>
            </div>
        `;
    },

    // modules/render/proPlusRenderer.js 内部的这个方法建议改成这样：

    _getAccountItemHTML(label, desc, color) {
        const banks = ['icbc', 'ccb', 'boc', 'abc', 'bocom'];
        const rows = banks.map(bank => `
            <div style="display: grid; grid-template-columns: 45px 1fr 1fr; gap: 8px; margin-bottom: 8px; align-items: center; width: 100%; box-sizing: border-box;">
                <span style="font-size: 11px; font-weight: bold; color: #d9d9d9; text-transform: uppercase;">${bank}</span>
                
                <div style="position: relative; width: 100%;">
                    <input type="number" id="pp-base-${label.toLowerCase()}-${bank}" 
                        placeholder="实时" 
                        style="width: 100%; height: 26px; font-size: 12px; background: #262626; border: 1px solid #434343; color: #ffffff; padding: 0 6px; border-radius: 4px; box-sizing: border-box;">
                </div>

                <div style="position: relative; width: 100%;">
                    <input type="number" id="pp-last-${label.toLowerCase()}-${bank}" 
                        placeholder="底色" 
                        style="width: 100%; height: 26px; font-size: 12px; background: #2b2111; border: 1px solid #876800; color: #ffc53d; padding: 0 6px; border-radius: 4px; box-sizing: border-box;">
                </div>
            </div>
        `).join('');

        return `
            <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.1); box-sizing: border-box; width: 100%;">
                <div style="color: ${color}; font-size: 12px; font-weight: 900; margin-bottom: 12px; display: flex; align-items: center; letter-spacing: 1px;">
                    <span style="width: 3px; height: 12px; background: ${color}; margin-right: 8px; border-radius: 2px;"></span>
                    账户 ${label} · ${desc}
                </div>
                ${rows}
            </div>
        `;
    },

    renderExecution(xValue, bankName) {
        const actionMain = document.getElementById('pp-action-main');
        if (xValue > 0) {
            actionMain.innerHTML = `每日维持：<span style="color:#ffb400">￥${xValue.toLocaleString()}</span>`;
            actionMain.style.fontSize = "18px";
        } else {
            actionMain.innerHTML = `<span style="color:#52c41a">资产盈余/已达标</span>`;
        }
    },

    updateDashboard(snapshot) {
        const container = document.getElementById('pp-main-display');
        if (!container) return;

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                   ${this.renderBaseStats(snapshot)}
                </div>
                <div>
                   ${this.renderROICard(snapshot.expectedROI, snapshot.ssi)}
                </div>
            </div>
            ${this.renderActuarialSection(snapshot)}
        `;
    }

};