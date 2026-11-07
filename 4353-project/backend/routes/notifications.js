const router = require('express').Router();

const {
  addNotification,
  getNotifications,
} = require('../services/notificationService');

// Get notifications for a specific user
router.get('/:userId', async (req, res) => {
  try {
    const notifications = await getNotifications(req.params.userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a notification
router.post('/', async (req, res) => {
  try {
    const { userId, message } = req.body;

    const notification = await addNotification(userId, message);

    res.status(201).json(notification);
  } catch (error) {
    const status = error.message.includes('required') ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
});

module.exports = router;