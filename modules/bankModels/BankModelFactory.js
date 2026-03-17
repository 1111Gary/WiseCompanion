import { DailyAverageModel } from './DailyAverageModel.js';

export const BankModelFactory = {

    create(task, profile) {

        const bank =
            task.source_app || '';

        if (bank.includes('工商')) {

            return new DailyAverageModel(
                task,
                profile
            );

        }

        return null;

    }

};