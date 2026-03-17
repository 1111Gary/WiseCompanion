export const RewardParser = {
    parse(reward) {
        if (!reward) return 0;

        if (typeof reward === "number") return reward;

        if (typeof reward === "string") {
            const num = parseFloat(reward);
            return isNaN(num) ? 0 : num;
        }

        if (typeof reward === "object") {
            return reward.amount || reward.value || 0;
        }

        return 0;
    }
};