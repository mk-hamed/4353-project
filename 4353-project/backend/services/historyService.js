const AppError = require('../utils/AppError');

const history = [];
let nextId = 1;

function validateUserId(userId) {
  if (
    (typeof userId !== 'string' && typeof userId !== 'number') ||
    String(userId).trim() === ''
  ) {
    throw new AppError(
      'userId must be a non-empty string or number',
      400
    );
  }
}

function addHistoryRecord(userId, record) {
  validateUserId(userId);

  if (
    record === null ||
    typeof record !== 'object' ||
    Array.isArray(record)
  ) {
    throw new AppError('record must be an object', 400);
  }

  const historyRecord = {
    id: nextId++,
    userId: String(userId),
    record: { ...record },
    createdAt: new Date().toISOString(),
  };

  history.push(historyRecord);

  return {
    ...historyRecord,
    record: { ...historyRecord.record },
  };
}

function getHistory(userId) {
  validateUserId(userId);

  return history
    .filter((entry) => entry.userId === String(userId))
    .map((entry) => ({
      ...entry,
      record: { ...entry.record },
    }));
}

module.exports = {
  addHistoryRecord,
  getHistory,
};