const router = require('express').Router();

const {
  addNotification,
  getNotifications,
} = require('../services/notificationService');

// Get notifications for a specific user
router.get('/:userId', (req, res) => {
  const notifications = getNotifications(req.params.userId);
  res.json(notifications);
});

// Add a notification
router.post('/', (req, res) => {
  const { userId, message } = req.body;

  const notification = addNotification(userId, message);

  res.status(201).json(notification);
});

module.exports = router;