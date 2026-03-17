export function initAppLifecycle(RenderEngine) {

    document.addEventListener('visibilitychange', () => {
        if (
            document.visibilityState === 'visible' &&
            sessionStorage.getItem('need_refresh_after_task') === '1'
        ) {
            sessionStorage.removeItem('need_refresh_after_task');
            RenderEngine.refresh();
        }
    });

}