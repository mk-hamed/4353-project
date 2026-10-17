const AppError = require('../utils/AppError');

// Position is one-based for a waiting user; zero represents no waiting users.
// A3's agreed rule includes one service duration for position 1.
function calculateWaitTime(position, durationMin) {
  if (!Number.isSafeInteger(position) || position < 0) {
    throw new AppError('Position must be a non-negative safe integer', 400);
  }
  if (!Number.isInteger(durationMin) || durationMin < 1 || durationMin > 480) {
    throw new AppError('durationMin must be a whole number between 1 and 480', 400);
  }
  const minutes = position * durationMin;
  if (!Number.isSafeInteger(minutes)) {
    throw new AppError('Estimated wait is too large', 400);
  }
  return minutes;
}

module.exports = { calculateWaitTime };
