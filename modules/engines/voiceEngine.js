// voiceEngine.js
export const VoiceEngine = {
    play(text) {
        // 💡 这里的 LandingController 建议通过 window 访问，避免循环引用
        if (!text || (window.LandingController && window.LandingController.isShowing())) {
            return;
        }
        
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN'; 
        u.rate = 0.95;
        u.pitch = 1.0;
        window.speechSynthesis.speak(u);
    }
};

export const AGENT_INTRO_VOICE = "好的，这个活动很简单，跟我来。";

window.VoiceEngine = VoiceEngine;