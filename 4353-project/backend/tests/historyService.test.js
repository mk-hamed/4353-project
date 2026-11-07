jest.mock('../repositories/historyRepository');

const historyRepository = require('../repositories/historyRepository');

const {
  addHistoryRecord,
  getHistory,
} = require('../services/historyService');

describe('historyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('adds a history record successfully', async () => {
    const mockRecord = {
      historyId: 1,
      userId: 1,
      record: {
        service: 'Student Inquiries',
        outcome: 'Joined',
      },
      createdAt: new Date(),
    };

    historyRepository.create.mockResolvedValue(mockRecord);

    const result = await addHistoryRecord(1, {
      service: 'Student Inquiries',
      outcome: 'Joined',
    });

    expect(result).toEqual(mockRecord);

    expect(historyRepository.create).toHaveBeenCalledWith(1, {
      service: 'Student Inquiries',
      outcome: 'Joined',
    });
  });

  test('retrieves history for a specific user', async () => {
    const mockHistory = [
      {
        historyId: 1,
        userId: 2,
        record: {
          service: 'Student Inquiries',
          outcome: 'Joined',
        },
        createdAt: new Date(),
      },
    ];

    historyRepository.findByUserId.mockResolvedValue(mockHistory);

    const result = await getHistory(2);

    expect(result).toEqual(mockHistory);
    expect(historyRepository.findByUserId).toHaveBeenCalledWith(2);
  });

  test('rejects an invalid user ID', async () => {
    await expect(
      addHistoryRecord('', { service: 'Test' })
    ).rejects.toThrow(
      'userId must be a non-empty string or number'
    );
  });

  test('rejects a missing record', async () => {
    await expect(
      addHistoryRecord(1, null)
    ).rejects.toThrow('Record must be an object');
  });

  test('rejects a string instead of an object', async () => {
    await expect(
      addHistoryRecord(1, 'Invalid record')
    ).rejects.toThrow('Record must be an object');
  });

  test('rejects an array instead of an object', async () => {
    await expect(
      addHistoryRecord(1, ['invalid'])
    ).rejects.toThrow('Record must be an object');
  });

  test('propagates database errors', async () => {
    historyRepository.create.mockRejectedValue(
      new Error('Database connection failed')
    );

    await expect(
      addHistoryRecord(1, { service: 'Test' })
    ).rejects.toThrow('Database connection failed');
  });
});