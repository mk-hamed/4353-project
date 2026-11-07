jest.mock('../repositories/notificationsRepository');

const notificationRepository = require('../repositories/notificationsRepository');

const {
  addNotification,
  getNotifications,
} = require('../services/notificationService');

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('adds a notification with the expected fields', async () => {
    const mockNotification = {
      notificationId: 1,
      userId: 1,
      message: 'Your queue position is now 2.',
      read: false,
      createdAt: new Date(),
    };

    notificationRepository.create.mockResolvedValue(mockNotification);

    const notification = await addNotification(
      1,
      'Your queue position is now 2.'
    );

    expect(notification).toMatchObject({
      notificationId: 1,
      userId: 1,
      message: 'Your queue position is now 2.',
      read: false,
    });

    expect(notification.createdAt).toBeDefined();
    expect(notificationRepository.create).toHaveBeenCalledWith(
      1,
      'Your queue position is now 2.'
    );
  });

  test('returns notifications for the requested user', async () => {
    const mockNotifications = [
      {
        notificationId: 1,
        userId: 2,
        message: 'Your appointment is confirmed.',
        read: false,
        createdAt: new Date(),
      },
    ];

    notificationRepository.findByUserId.mockResolvedValue(mockNotifications);

    const notifications = await getNotifications(2);

    expect(notifications).toEqual(mockNotifications);
    expect(notificationRepository.findByUserId).toHaveBeenCalledWith(2);
  });

  test('rejects an empty message', async () => {
    await expect(addNotification(3, '  ')).rejects.toThrow(
      'message must be a non-empty string'
    );
  });

  test('rejects a message longer than 500 characters', async () => {
    await expect(
      addNotification(4, 'a'.repeat(501))
    ).rejects.toThrow('message must be 500 characters or fewer');
  });

  test('rejects an invalid user ID', async () => {
    await expect(
      addNotification('', 'Test message')
    ).rejects.toThrow(
      'userId must be a non-empty string or number'
    );
  });

  test('propagates database errors', async () => {
    notificationRepository.create.mockRejectedValue(
      new Error('Database connection failed')
    );

    await expect(
      addNotification(5, 'Test message')
    ).rejects.toThrow('Database connection failed');
  });
});