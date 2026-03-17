export class BaseBankModel {

    constructor(task, profile) {
        this.task = task;
        this.profile = profile;
    }

    evaluate(capitalAllocation = 0) {

        return {
            qualified: false,
            requiredCapital: 0,
            reward: 0,
            nextMonthBase: 0,
            riskFlags: [],
            strategyHint: ''
        };

    }

}