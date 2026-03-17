export const TierParser = {
    parse(plan) {

        if (!Array.isArray(plan)) return [];

        return plan.map(t => ({
            bank: t.bank || "",
            name: t.name || "",
            amount: Number(t.amount || 0),
            reward: Number(t.reward || 0)
        }));
    }
};