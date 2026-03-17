// modules/localState.js
import { TimeUtils } from '../utils/timeUtils.js';

function getOngoingKey() {
    return `nex_ongoing_${TimeUtils.getLocalDateKey()}`;
}

export const LocalState = {

    getList(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch {
            return [];
        }
    },

    saveList(key, list) {
        localStorage.setItem(key, JSON.stringify(list));
    },

    getOngoingIds() {
        return this.getList(getOngoingKey());
    },

    addToOngoing(id) {
        const list = this.getOngoingIds();
        if (!list.includes(String(id))) {
            list.unshift(String(id));
            this.saveList(getOngoingKey(), list);
        }
    },

    removeFromOngoing(id) {
        const list = this.getOngoingIds()
            .filter(x => String(x) !== String(id));

        this.saveList(getOngoingKey(), list);
    }
};
window.LocalState = LocalState;