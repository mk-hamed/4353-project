const AppError = require('../utils/AppError');
const notificationRepository = require('../repositories/notificationsRepository');

function validateUserId(userId) {
  if (
    (typeof userId !== 'string' && typeof userId !== 'number') ||
    String(userId).trim() === ''
  ) {
    throw new AppError('userId must be a non-empty string or number', 400);
  }
}

async function addNotification(userId, message) {
  validateUserId(userId);

  if (typeof message !== 'string' || !message.trim()) {
    throw new AppError('message must be a non-empty string', 400);
  }

  if (message.trim().length > 500) {
    throw new AppError('message must be 500 characters or fewer', 400);
  }

  return await notificationRepository.create(userId, message.trim());
}

async function getNotifications(userId) {
  validateUserId(userId);

  return await notificationRepository.findByUserId(userId);
}

module.exports = {
  addNotification,
  getNotifications,
};