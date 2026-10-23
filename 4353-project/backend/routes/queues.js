const router = require('express').Router();
const { authenticate, requireRole, requireAdmin } = require('../middleware/auth');
const queueService = require('../services/queueService');

const requireUser = requireRole('user');

// Every queue endpoint needs a verified token (sets req.user = { id, role }).
router.use(authenticate);

// Order matters: /current must be declared before /:serviceId.
router.get('/', (req, res) => res.json(queueService.getQueueSummaries()));
router.get('/current', requireUser, (req, res) => res.json(queueService.getCurrentQueue(req.user.id)));

router.post('/:serviceId/join', requireUser, (req, res) => {
  res.status(201).json(queueService.joinQueue(req.user.id, req.params.serviceId));
});
router.post('/:serviceId/leave', requireUser, (req, res) => {
  res.json(queueService.leaveQueue(req.user.id, req.params.serviceId));
});

router.get('/:serviceId', requireAdmin, (req, res) => res.json(queueService.getQueue(req.params.serviceId)));
router.post('/:serviceId/serve-next', requireAdmin, (req, res) => {
  res.json(queueService.serveNext(req.params.serviceId));
});

module.exports = router;
