// modules/controllers/identityManager.js

export const IdentityManager = {

    sbClient: null,
    userId: null,

    initClient(supabaseUrl, supabaseKey) {
        this.sbClient = window.supabase.createClient(
            supabaseUrl,
            supabaseKey
        );
        // 过渡兼容层
        window.sbClient = this.sbClient;
    },

    async init() {
        const { data: { session } } = await this.sbClient.auth.getSession();

        if (session) {
            this.userId = session.user.id;
            window.USER_ID = this.userId;
            console.log("✅ [Identity] 已恢复会话:", this.userId);
            return true;
        }

        console.log("🔒 [Identity] 需要新会话，启动 Captcha...");
        return new Promise((resolve) => {
            this.showCaptchaModal(async (token) => {
                const uid = await this.signInAnonymously(token);
                this.userId = uid;
                window.USER_ID = uid;
                resolve(true);
            });
        });
    },

    async signInAnonymously(captchaToken) {
        try {
            const { data, error } = await this.sbClient.auth.signInAnonymously({
                options: { captchaToken }
            });

            if (error) throw error;

            console.log("✅ [Identity] 匿名登录成功:", data.user.id);

            const overlay = document.getElementById('nex-captcha-overlay');
            if (overlay) overlay.style.display = 'none';

            return data.user.id;

        } catch (err) {
            console.error("❌ [Identity] 登录失败:", err);
            alert("登录验证失败，请刷新重试");
            return null;
        }
    },

    showCaptchaModal(onSuccess) {
        let overlay = document.getElementById('nex-captcha-overlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'nex-captcha-overlay';
            overlay.style.cssText =
                "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;";

            overlay.innerHTML = `
                <div style="background:#1e293b;padding:24px;border-radius:16px;text-align:center;border:1px solid #334155;">
                    <h3 style="margin-bottom:16px;font-size:18px;">安全验证</h3>
                    <p style="margin-bottom:20px;font-size:14px;color:#94a3b8;">
                        NEX AI 正在为您创建加密身份...
                    </p>
                    <div id="cf-turnstile-container"></div>
                </div>
            `;

            document.body.appendChild(overlay);
        }

        overlay.style.display = 'flex';

        if (window.turnstile) {
            turnstile.render('#cf-turnstile-container', {
                sitekey: '0x4AAAAAACgbxH60C9qqu3Kf',
                theme: 'dark',
                callback: function (token) {
                    console.log("🛡️ Captcha 通过");
                    onSuccess(token);
                }
            });
        } else {
            alert("安全组件加载失败，请检查网络");
        }
    }

};