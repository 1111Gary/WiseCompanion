export const JudgementBlock = {

    render(proTips = []) {

        if (!proTips || !proTips.length) return "";

        let verdict = "";
        let risk = "";
        let action = "";

        proTips.forEach(item => {
            if (item.type === "verdict") verdict = item.text;
            if (item.type === "risk") risk = item.text;
            if (item.type === "action") action = item.text;
        });

        return `
            <div style="margin-top:20px;">

                <div style="font-size:12px;color:#aaa;margin-bottom:8px;">
                    🧐 老手判断 · 判断结果
                </div>

                ${verdict ? `
                <div style="margin-bottom:14px;">
                    <div style="font-weight:bold;margin-bottom:4px;">🧠 判断结论</div>
                    <div style="line-height:1.6;">${verdict}</div>
                </div>
                ` : ""}

                ${risk ? `
                <div style="margin-bottom:14px;">
                    <div style="font-weight:bold;margin-bottom:4px;">⚠️ 风险与限制</div>
                    <div style="line-height:1.6;">${risk}</div>
                </div>
                ` : ""}

                ${action ? `
                <div>
                    <div style="font-weight:bold;margin-bottom:4px;">🚀 行动建议</div>
                    <div style="line-height:1.6;">${action}</div>
                </div>
                ` : ""}

            </div>
        `;
    }

};