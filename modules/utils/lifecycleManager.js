// lifecycleManager.js
export const LifecycleManager = {
    init() {
        document.addEventListener('visibilitychange', () => {
            // 当页面从后台回到前台，且标记了需要刷新时
            if (document.visibilityState === 'visible' && 
                sessionStorage.getItem('need_refresh_after_task') === '1') {
                
                sessionStorage.removeItem('need_refresh_after_task');
                
                // 确保 RenderEngine 已就绪
                if (window.RenderEngine && typeof window.RenderEngine.refresh === 'function') {
                    console.log("🔄 检测到任务返回，正在自动刷新...");
                    window.RenderEngine.refresh();
                }
            }
        });
    }
};