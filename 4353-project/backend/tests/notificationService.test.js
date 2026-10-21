const {
  addNotification,
  getNotifications,
} = require('../services/notificationService');

describe('notificationService', () => {
  test('adds a notification with the expected fields', () => {
    const notification = addNotification(
      'test-user-1',
      'Your queue position is now 2.'
    );

    expect(notification).toMatchObject({
      userId: 'test-user-1',
      message: 'Your queue position is now 2.',
      read: false,
    });

    expect(notification.id).toBeDefined();
    expect(notification.createdAt).toBeDefined();
  });

  test('returns notifications for the requested user', () => {
    addNotification('test-user-2', 'Your appointment is confirmed.');

    const notifications = getNotifications('test-user-2');

    expect(notifications.length).toBeGreaterThan(0);
    expect(
      notifications.every(
        (notification) => notification.userId === 'test-user-2'
      )
    ).toBe(true);
  });

  test('rejects an empty message', () => {
    expect(() => addNotification('test-user-3', '  ')).toThrow(
      'message must be a non-empty string'
    );
  });

  test('rejects a message longer than 500 characters', () => {
    expect(() =>
      addNotification('test-user-4', 'a'.repeat(501))
    ).toThrow('message must be 500 characters or fewer');
  });

  test('rejects an invalid user ID', () => {
    expect(() => addNotification('', 'Test message')).toThrow(
      'userId must be a non-empty string or number'
    );
  });
});