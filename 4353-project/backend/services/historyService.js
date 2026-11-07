const AppError = require('../utils/AppError');
const historyRepository = require('../repositories/historyRepository');

function validateUserId(userId) {
    if (
        (typeof userId !== 'string' && typeof userId !== 'number') ||
        String(userId).trim() === ''
    ) {
        throw new AppError('userId must be a non-empty string or number', 400);
    }
}

async function addHistoryRecord(userId, record) {
    validateUserId(userId);

    if (!record || typeof record !== 'object' || Array.isArray(record)) {
        throw new AppError('Record must be an object', 400);
    }

    return await historyRepository.create(userId, record);
}

async function getHistory(userId) {
    validateUserId(userId);

    return await historyRepository.findByUserId(userId);
}

module.exports = {
    addHistoryRecord,
    getHistory
};