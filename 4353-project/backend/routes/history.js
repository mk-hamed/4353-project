const router = require('express').Router();

const {
  addHistoryRecord,
  getHistory,
} = require('../services/historyService');

// Get history records for a specific user
router.get('/:userId', async (req, res) => {
  try {
    const history = await getHistory(req.params.userId);
    res.json(history);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message,
    });
  }
});

// Add a history record
router.post('/', async (req, res) => {
  try {
    const { userId, record } = req.body;

    const historyRecord = await addHistoryRecord(userId, record);

    res.status(201).json(historyRecord);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message,
    });
  }
});

module.exports = router;