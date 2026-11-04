const { queueEntries } = require('../mock/data');

// A3 compatibility: Asad will replace this count with a QueueEntry database query.
// Queue length is derived queue data, never a persisted Service column.
function getQueueLength(serviceId) {
  return queueEntries.filter((entry) => entry.serviceId === serviceId).length;
}

module.exports = { getQueueLength };
