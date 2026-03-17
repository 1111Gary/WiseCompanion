// uiUtils.js
export const UIUtils = {
    toast(msg) {
        const b = document.getElementById('toast-box');
        if (!b) return;
        b.innerText = msg;
        b.classList.add('active');
        setTimeout(() => b.classList.remove('active'), 2000);
    }
};

// 关键：为了兼容 HTML 里的 onclick，挂载到 window
window.UIUtils = UIUtils;