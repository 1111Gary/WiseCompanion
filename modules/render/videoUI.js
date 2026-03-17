export function applyVideoEmotionUI(state) {

    const videoSection = document.getElementById("video-section");
    const nightTip = document.getElementById("night-whisper");
    const icon = document.getElementById("video-toggle-icon");

    if (!videoSection) return;

    if (state === "night") {
        videoSection.classList.remove("collapsed");
        videoSection.classList.remove("video-day");
        videoSection.classList.add("video-night");
        if (icon) icon.innerText = "▲";
        if (nightTip) nightTip.innerText = "夜深了，适合轻松处理一些低强度内容。";
    } else {
        videoSection.classList.add("collapsed");
        videoSection.classList.add("video-day");
        videoSection.classList.remove("video-night");
        if (icon) icon.innerText = "▼";
        if (nightTip) nightTip.innerText = "";
    }
}


export function toggleVideoSection() {

    const section = document.getElementById("video-section");
    const icon = document.getElementById("video-toggle-icon");

    if (!section) return;

    if (section.classList.contains("collapsed")) {
        section.classList.remove("collapsed");
        if (icon) icon.innerText = "▲";
    } else {
        section.classList.add("collapsed");
        if (icon) icon.innerText = "▼";
    }
}