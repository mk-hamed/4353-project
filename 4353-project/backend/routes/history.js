const router = require('express').Router();

const {
  addHistoryRecord,
  getHistory,
} = require('../services/historyService');

// Get history records for a specific user
router.get('/:userId', (req, res) => {
  const history = getHistory(req.params.userId);
  res.json(history);
});

// Add a history record
router.post('/', (req, res) => {
  const { userId, record } = req.body;

  const historyRecord = addHistoryRecord(userId, record);

  res.status(201).json(historyRecord);
});

module.exports = router;