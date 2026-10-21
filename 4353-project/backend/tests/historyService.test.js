const {
  addHistoryRecord,
  getHistory,
} = require('../services/historyService');

describe('historyService', () => {
  test('adds a history record with the expected fields', () => {
    const entry = addHistoryRecord('history-user-1', {
      action: 'joined_queue',
      queueId: 'queue-1',
    });

    expect(entry).toMatchObject({
      userId: 'history-user-1',
      record: {
        action: 'joined_queue',
        queueId: 'queue-1',
      },
    });

    expect(entry.id).toBeDefined();
    expect(entry.createdAt).toBeDefined();
  });

  test('returns records belonging to the requested user', () => {
    addHistoryRecord('history-user-2', {
      action: 'left_queue',
    });

    const entries = getHistory('history-user-2');

    expect(entries.length).toBeGreaterThan(0);
    expect(
      entries.every((entry) => entry.userId === 'history-user-2')
    ).toBe(true);
  });

  test('rejects an invalid user ID', () => {
    expect(() =>
      addHistoryRecord('', { action: 'joined_queue' })
    ).toThrow('userId must be a non-empty string or number');
  });

  test('rejects a non-object record', () => {
    expect(() =>
      addHistoryRecord('history-user-3', 'joined_queue')
    ).toThrow('record must be an object');
  });

  test('rejects an array as a record', () => {
    expect(() =>
      addHistoryRecord('history-user-4', [])
    ).toThrow('record must be an object');
  });
});