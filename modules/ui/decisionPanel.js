import { ProJudgementBlock } from "./proJudgementBlock.js";
import { MembershipManager } from "../controllers/membershipManager.js";
export const DecisionPanel = {

    open(model) {

        let panel = document.getElementById("decision-panel");

        if (!panel) {
            panel = document.createElement("div");
            panel.id = "decision-panel";
            panel.style.position = "fixed";
            panel.style.bottom = "0";
            panel.style.left = "0";
            panel.style.right = "0";
            panel.style.maxHeight = "80%";
            panel.style.background = "#111";
            panel.style.color = "#fff";
            panel.style.padding = "20px";
            panel.style.overflowY = "auto";
            panel.style.zIndex = "9999";
            panel.style.borderTop = "1px solid #333";
            document.body.appendChild(panel);
        }
        const isPro = MembershipManager.isMember();
        const judgementHTML = ProJudgementBlock.render(model, isPro);
        panel.innerHTML = `
    <div style="margin-bottom:12px;">
        <span style="
            background:#222;
            padding:4px 8px;
            font-size:12px;
            border:1px solid #333;
        ">
            ${model.archetype}
        </span>
    </div>

    <h3 style="margin:8px 0;">${model.title}</h3>
     ${judgementHTML}   <!-- 🔥 就插在这里 -->
    

    <div style="margin-top:20px;">
        <button id="enter-task" style="
            width:100%;
            padding:10px;
            background:#333;
            color:#fff;
            border:none;
        ">
            进入执行
        </button>

        <button id="close-decision" style="
            width:100%;
            padding:10px;
            margin-top:8px;
            background:#111;
            color:#aaa;
            border:1px solid #333;
        ">
            关闭
        </button>
    </div>
`;

        document.getElementById("enter-task").onclick = () => {


            if (!model.link || model.link.length < 5) {
                alert("暂无直达链接");
                return;
            }

            const newWin = window.open(model.link, "_blank");

            if (!newWin) {
                // 如果被拦截
                window.location.href = model.link;
            }

        };

        document.getElementById("close-decision").onclick = () => {
            panel.remove();
        };
    }

};