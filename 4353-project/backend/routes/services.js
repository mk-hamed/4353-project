const router = require('express').Router();
const { listServices, createService, updateService } = require('../services/serviceService');
const { authenticate } = require('../middleware/auth');
const requireServiceAdmin = require('../middleware/requireServiceAdmin');

router.get('/', async (req, res) => res.json(await listServices()));
router.post('/', authenticate, requireServiceAdmin, async (req, res) => {
  res.status(201).json(await createService(req.body));
});
router.put('/:id', authenticate, requireServiceAdmin, async (req, res) => {
  res.json(await updateService(req.params.id, req.body));
});

module.exports = router;
