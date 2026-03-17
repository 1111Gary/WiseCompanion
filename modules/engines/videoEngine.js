export const VideoEngine = {

    getEmotionalTimeState(date = new Date()) {
        const hour = date.getHours();
        return (hour >= 21 || hour < 6) ? "night" : "day";
    },

    getRotatedVideos(videoList = [], showCount = 5, date = new Date()) {
        if (!videoList || videoList.length <= showCount) {
            return videoList;
        }

        const startOfYear = new Date(date.getFullYear(), 0, 0);
        const diff = date - startOfYear;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayIndex = Math.floor(diff / oneDay);

        const startIndex = dayIndex % videoList.length;

        const rotated = [
            ...videoList.slice(startIndex),
            ...videoList.slice(0, startIndex)
        ];

        return rotated.slice(0, showCount);
    }

};