const router = require('express').Router();
const { authenticate, requireRole, requireAdmin } = require('../middleware/auth');
const queueService = require('../services/queueService');

const requireUser = requireRole('user');

// Every queue endpoint needs a verified token (sets req.user = { id, role }).
router.use(authenticate);

// Order matters: /current must be declared before /:serviceId.
router.get('/', async (req, res) => res.json(await queueService.getQueueSummaries()));
router.get('/current', requireUser, async (req, res) => res.json(await queueService.getCurrentQueue(req.user.id)));

router.post('/:serviceId/join', requireUser, async (req, res) => {
  res.status(201).json(await queueService.joinQueue(req.user.id, req.params.serviceId));
});
router.post('/:serviceId/leave', requireUser, async (req, res) => {
  res.json(await queueService.leaveQueue(req.user.id, req.params.serviceId));
});

router.get('/:serviceId', requireAdmin, async (req, res) => res.json(await queueService.getQueue(req.params.serviceId)));
router.post('/:serviceId/serve-next', requireAdmin, async (req, res) => {
  res.json(await queueService.serveNext(req.params.serviceId));
});

module.exports = router;
