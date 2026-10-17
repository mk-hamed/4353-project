const router = require('express').Router();
const { listServices, createService, updateService } = require('../services/serviceService');
const requireServiceAdmin = require('../middleware/requireServiceAdmin');

router.get('/', (req, res) => res.json(listServices()));
router.post('/', requireServiceAdmin, (req, res) => {
  res.status(201).json(createService(req.body));
});
router.put('/:id', requireServiceAdmin, (req, res) => {
  res.json(updateService(req.params.id, req.body));
});

module.exports = router;
