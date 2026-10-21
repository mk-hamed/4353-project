const AppError = require('../utils/AppError');

const notifications = [];
let nextId = 1;

function validateUserId(userId) {
  if (
    (typeof userId !== 'string' && typeof userId !== 'number') ||
    String(userId).trim() === ''
  ) {
    throw new AppError('userId must be a non-empty string or number', 400);
  }
}

function addNotification(userId, message) {
  validateUserId(userId);

  if (typeof message !== 'string' || !message.trim()) {
    throw new AppError('message must be a non-empty string', 400);
  }

  if (message.trim().length > 500) {
    throw new AppError('message must be 500 characters or fewer', 400);
  }

  const notification = {
    id: nextId++,
    userId: String(userId),
    message: message.trim(),
    createdAt: new Date().toISOString(),
    read: false,
  };

  notifications.push(notification);

  return { ...notification };
}

function getNotifications(userId) {
  validateUserId(userId);

  return notifications
    .filter((notification) => notification.userId === String(userId))
    .map((notification) => ({ ...notification }));
}

module.exports = {
  addNotification,
  getNotifications,
};