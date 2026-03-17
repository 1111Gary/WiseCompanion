// taskDataService.js

import { buildTaskData } from "../controllers/taskDataBuilder.js";

export const TaskDataService = {

    async fetchAll(userId, todayKey) {

        
        return await buildTaskData({
            sbClient: window.sbClient,
            userId,
            todayKey
        });

    }

};