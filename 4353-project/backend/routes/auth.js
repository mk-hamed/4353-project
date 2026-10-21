const express = require("express");
const authService = require("../services/authService");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    res.status(201).json(await authService.register(req, body));
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
    try {
        res.json(await authService.login(req, body));
    } catch (err) {
        next(err);
    }
});

router.get('/me', authenticate, (req, res, next) => {
    try {
        res.json(authService.getUserById(req.user.id));
    } catch (err) {
        next(err);
    }
});

module.exports = router;