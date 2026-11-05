const { countWaiting } = require('../repositories/queueRepository');

// Queue length is derived from waiting QueueEntry rows, never stored on Service.
async function getQueueLength(serviceId) {
  return (await countWaiting()).get(serviceId) || 0;
}

module.exports = { getQueueLength };
