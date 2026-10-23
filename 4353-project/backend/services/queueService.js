const AppError = require('../utils/AppError');
const { users, services, queueEntries, servedEntries } = require('../mock/data');
const { getServiceById } = require('./serviceService');
const { calculateWaitTime } = require('./waitTimeService');
const { addNotification } = require('./notificationService');
const { addHistoryRecord } = require('./historyService');

// Ordering rule: higher priority first, then earlier arrival. Each entry keeps the
// service's priority level from the moment the user joined.
const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };
// A user at this position or closer is "almost ready" and gets a notification.
const ALMOST_READY_POSITION = 2;

let nextSeq = queueEntries.reduce((max, entry) => Math.max(max, entry.seq), 0) + 1;

function validateUserId(userId) {
  if ((typeof userId !== 'string' && typeof userId !== 'number') || String(userId).trim() === '') {
    throw new AppError('userId is required', 400);
  }
}

function sameUser(entry, userId) {
  return String(entry.userId) === String(userId);
}

// filter() copies, so sorting never reorders the stored array.
function sortedEntries(serviceId) {
  return queueEntries
    .filter((entry) => entry.serviceId === serviceId)
    .sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || a.seq - b.seq);
}

function statusForPosition(position) {
  return position <= ALMOST_READY_POSITION ? 'almost-ready' : 'waiting';
}

// Keep the service list's queueLength equal to the real queue size.
function syncQueueLength(serviceId) {
  const service = services.find((item) => item.id === serviceId);
  if (service) service.queueLength = queueEntries.filter((entry) => entry.serviceId === serviceId).length;
}

function describeEntry(entry, service) {
  const ordered = sortedEntries(service.id);
  const position = ordered.findIndex((item) => item.id === entry.id) + 1;
  return {
    serviceId: service.id,
    serviceName: service.name,
    position,
    status: statusForPosition(position),
    estimatedWaitMin: calculateWaitTime(position, service.durationMin),
    queueLength: ordered.length,
    joinedAt: entry.joinedAt,
  };
}

// Member 4's modules. Demo entries are not real accounts, so they are skipped.
function recordHistory(entry, service, action, outcome) {
  if (entry.demo) return;
  addHistoryRecord(entry.userId, {
    action,
    outcome,
    serviceId: service.id,
    service: service.name,
    date: new Date().toLocaleDateString('en-CA'), // local YYYY-MM-DD, not UTC
  });
}

function notify(entry, message) {
  if (!entry.demo) addNotification(entry.userId, message);
}

// Sends each user's "almost ready" notification once, the first time they reach the front.
function notifyAlmostReady(service) {
  sortedEntries(service.id).forEach((entry, index) => {
    const position = index + 1;
    if (position <= ALMOST_READY_POSITION && !entry.almostReadyNotified) {
      entry.almostReadyNotified = true;
      notify(entry, `You're almost up for ${service.name}. You are number ${position} in line.`);
    }
  });
}

function joinQueue(userId, serviceId) {
  validateUserId(userId);
  const service = getServiceById(serviceId);
  if (service.status !== 'open') throw new AppError('This queue is closed', 409);

  const existing = queueEntries.find((entry) => sameUser(entry, userId));
  if (existing) {
    throw new AppError(
      existing.serviceId === service.id
        ? 'You are already in this queue'
        : 'You are already in another queue. Leave it before joining a new one',
      409,
    );
  }

  const user = users.find((item) => String(item.id) === String(userId));
  const entry = {
    id: nextSeq,
    seq: nextSeq,
    serviceId: service.id,
    userId,
    email: user ? user.email : null,
    priority: service.priority,
    joinedAt: new Date().toISOString(),
    almostReadyNotified: false,
  };
  nextSeq += 1;
  queueEntries.push(entry);

  const servedIndex = servedEntries.findIndex((item) => sameUser(item, userId));
  if (servedIndex !== -1) servedEntries.splice(servedIndex, 1);
  syncQueueLength(service.id);

  const result = describeEntry(entry, service);
  recordHistory(entry, service, 'joined_queue', 'Joined');
  notify(entry, `You joined ${service.name}. You are number ${result.position}; estimated wait is ${result.estimatedWaitMin} minutes.`);
  notifyAlmostReady(service);
  return result;
}

function leaveQueue(userId, serviceId) {
  validateUserId(userId);
  const service = getServiceById(serviceId);
  const entry = queueEntries.find((item) => item.serviceId === service.id && sameUser(item, userId));
  if (!entry) throw new AppError('You are not in this queue', 404);

  queueEntries.splice(queueEntries.indexOf(entry), 1);
  syncQueueLength(service.id);

  recordHistory(entry, service, 'left_queue', 'Left queue');
  notify(entry, `You left the ${service.name} queue.`);
  notifyAlmostReady(service); // people behind may now be close to the front
  return { serviceId: service.id, serviceName: service.name, left: true };
}

// The logged-in user's own status: still waiting, or just served, or neither.
function getCurrentQueue(userId) {
  validateUserId(userId);
  const entry = queueEntries.find((item) => sameUser(item, userId));
  if (entry) {
    return { currentQueue: describeEntry(entry, getServiceById(entry.serviceId)), lastServed: null };
  }
  const served = servedEntries.find((item) => sameUser(item, userId));
  if (!served) return { currentQueue: null, lastServed: null };
  const service = getServiceById(served.serviceId);
  return {
    currentQueue: null,
    lastServed: { serviceId: service.id, serviceName: service.name, servedAt: served.servedAt },
  };
}

// Admin view of one service's queue, in serving order.
function getQueue(serviceId) {
  const service = getServiceById(serviceId);
  const ordered = sortedEntries(service.id);
  return {
    service: {
      id: service.id,
      name: service.name,
      status: service.status,
      priority: service.priority,
      durationMin: service.durationMin,
    },
    length: ordered.length,
    queue: ordered.map((entry, index) => ({
      entryId: entry.id,
      userId: entry.userId,
      email: entry.email,
      priority: entry.priority,
      joinedAt: entry.joinedAt,
      position: index + 1,
      status: statusForPosition(index + 1),
      estimatedWaitMin: calculateWaitTime(index + 1, service.durationMin),
    })),
  };
}

function serveNext(serviceId) {
  const service = getServiceById(serviceId);
  const [next] = sortedEntries(service.id);
  if (!next) throw new AppError('No one is waiting in this queue', 409);

  queueEntries.splice(queueEntries.indexOf(next), 1);
  const servedIndex = servedEntries.findIndex((item) => sameUser(item, next.userId));
  if (servedIndex !== -1) servedEntries.splice(servedIndex, 1);
  servedEntries.push({ userId: next.userId, serviceId: service.id, servedAt: new Date().toISOString() });
  syncQueueLength(service.id);

  recordHistory(next, service, 'served', 'Served');
  notify(next, `It's your turn at ${service.name}. You have been served.`);
  notifyAlmostReady(service);
  return {
    served: { userId: next.userId, email: next.email, priority: next.priority, joinedAt: next.joinedAt },
    queueLength: queueEntries.filter((entry) => entry.serviceId === service.id).length,
  };
}

// Per-service size and the wait a new joiner would face (used by the Join Queue screen).
function getQueueSummaries() {
  return services.map((service) => {
    const rank = PRIORITY_RANK[service.priority];
    const entries = queueEntries.filter((entry) => entry.serviceId === service.id);
    const ahead = entries.filter((entry) => PRIORITY_RANK[entry.priority] >= rank).length;
    return {
      serviceId: service.id,
      queueLength: entries.length,
      estimatedWaitMin: calculateWaitTime(ahead + 1, service.durationMin),
    };
  });
}

// Test helper: empties every queue.
function resetQueues() {
  queueEntries.length = 0;
  servedEntries.length = 0;
  services.forEach((service) => { service.queueLength = 0; });
}

module.exports = {
  PRIORITY_RANK,
  ALMOST_READY_POSITION,
  joinQueue,
  leaveQueue,
  getCurrentQueue,
  getQueue,
  serveNext,
  getQueueSummaries,
  resetQueues,
};
