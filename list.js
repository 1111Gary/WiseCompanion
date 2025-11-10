/**
 * list.js - Bank 页面专用
 * 功能：
 * 1. 自动从 ./activities.json 拉取数据
 * 2. 根据 category 子分类（DailyTask, Payment, Deposit）渲染到对应 section
 * 3. 支持倒计时显示（只到日期，不显示具体时间）
 * 4. 自动生成银行筛选器按钮
 * 5. 左侧边框颜色映射：
 *    DailyTask → 绿色, Payment → 蓝色, Deposit → 黄色
 */

// 分类映射到 DOM 容器
const BANK_CATEGORY_MAP = {
    'DailyTask': 'routine-tasks-list',
    'Payment': 'payment-tasks-list',
    'Deposit': 'savings-tasks-list'
};

// 分类对应颜色
const CATEGORY_COLOR_MAP = {
    'DailyTask': 'var(--color-success)',
    'Payment': 'var(--color-primary)',
    'Deposit': 'var(--color-highlight)'
};

// 缓存活动数据
let allBankActivities = [];

// ------------------- 辅助函数 -------------------

// fetch JSON 并缓存
async function loadBankActivities() {
    try {
        const res = await fetch('./activities.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('activities.json 不是数组');
        allBankActivities = data.filter(a => a.category && a.category.includes('Bank'));
    } catch (e) {
        console.error('加载活动失败:', e);
        allBankActivities = [];
    }
}

// 格式化倒计时 (只到日期)
function formatCountdown(endDateStr) {
    if (!endDateStr) return '';
    const today = new Date();
    const endDate = new Date(endDateStr);
    const diffTime = endDate - today;
    if (diffTime < 0) return '已过期';
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `剩余 ${diffDays} 天`;
}

// 生成活动卡
function renderBankCard(activity, category) {
    const borderColor = CATEGORY_COLOR_MAP[category] || 'var(--color-card-bg)';
    const countdownText = activity.endDate ? formatCountdown(activity.endDate) : '';
    const countdownHtml = countdownText ? `<span class="countdown-badge ${countdownText==='已过期' ? 'expired-badge':''}">${countdownText}</span>` : '';
    
    const deepLinkUrl = activity.deepLink || '#';
    const icon = activity.icon || '❓';

    return `
    <div class="task-list-card" data-bank="${activity.sourceApp}" style="border-left-color:${borderColor}">
        ${countdownHtml}
        <div class="task-icon">${icon}</div>
        <div class="task-content">
            <div class="task-title">${activity.name}</div>
            <div class="task-subtitle">平台：${activity.sourceApp}</div>
            <div class="text-xs text-gray-500 mt-1">${activity.description}</div>
        </div>
        <div class="task-action">
            <a href="${deepLinkUrl}" target="_blank" rel="noopener noreferrer" class="action-button">去参与</a>
        </div>
    </div>
    `;
}

// 渲染分类列表
function renderBankCategory(category) {
    const containerId = BANK_CATEGORY_MAP[category];
    const container = document.getElementById(containerId);
    if (!container) return;

    const activities = allBankActivities.filter(a => a.category.includes(category));
    if (!activities.length) {
        container.innerHTML = `<p class="text-gray-400 text-center p-4">暂无活动</p>`;
        return;
    }

    container.innerHTML = activities.map(a => renderBankCard(a, category)).join('');
}

// 生成银行筛选器按钮
function generateBankFilters() {
    const filterContainer = document.getElementById('bank-filter-container');
    if (!filterContainer) return;

    const banks = [...new Set(allBankActivities.map(a => a.sourceApp))];
    banks.forEach(bank => {
        const btn = document.createElement('button');
        btn.className = 'filter-button';
        btn.dataset.bank = bank;
        btn.innerHTML = bank;
        filterContainer.appendChild(btn);

        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterBankActivities(bank);
        });
    });

    // 添加全部按钮
    const allBtn = filterContainer.querySelector('[data-bank="All"]');
    if (allBtn) {
        allBtn.addEventListener('click', () => {
            document.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active'));
            allBtn.classList.add('active');
            renderAllBankCategories();
        });
    }
}

// 根据银行筛选活动
function filterBankActivities(bank) {
    Object.keys(BANK_CATEGORY_MAP).forEach(category => {
        const containerId = BANK_CATEGORY_MAP[category];
        const container = document.getElementById(containerId);
        const activities = allBankActivities.filter(a => a.category.includes(category) && a.sourceApp === bank);
        container.innerHTML = activities.length ? activities.map(a => renderBankCard(a, category)).join('') : '<p class="text-gray-400 text-center p-4">暂无活动</p>';
    });
}

// 渲染全部分类
function renderAllBankCategories() {
    Object.keys(BANK_CATEGORY_MAP).forEach(renderBankCategory);
}

// ------------------- 主入口 -------------------
document.addEventListener('DOMContentLoaded', async () => {
    await loadBankActivities();
    generateBankFilters();
    renderAllBankCategories();
});
