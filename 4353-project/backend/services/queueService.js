const AppError = require('../utils/AppError');
const { users } = require('../mock/data');
const repo = require('../repositories/queueRepository');
const { getServiceById, listServices } = require('./serviceService');
const { calculateWaitTime } = require('./waitTimeService');
const { addNotification } = require('./notificationService');
const { addHistoryRecord } = require('./historyService');

// Ordering rule: higher priority first, then earlier arrival. Each entry keeps the
// service's priority level from the moment the user joined (stored as "priorityRank").
const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };
const PRIORITY_NAME = { 3: 'high', 2: 'medium', 1: 'low' };
// A user at this position or closer is "almost ready" and gets a notification.
const ALMOST_READY_POSITION = 2;

// Accepts 7 or '7' (the token id); rejects anything that is not a positive whole number.
function validateUserId(userId) {
  if ((typeof userId !== 'string' && typeof userId !== 'number') || !/^[1-9]\d{0,9}$/.test(String(userId).trim())
    || Number(userId) > 2147483647) {
    throw new AppError('userId is required', 400);
  }
  return Number(userId);
}

function statusForPosition(position) {
  return position <= ALMOST_READY_POSITION ? 'almost-ready' : 'waiting';
}

function emailFor(userId) {
  const user = users.find((item) => String(item.id) === String(userId));
  return user ? user.email : null;
}

function describeEntry(row, service) {
  return {
    serviceId: service.id,
    serviceName: service.name,
    position: row.position,
    status: statusForPosition(row.position),
    estimatedWaitMin: calculateWaitTime(row.position, service.durationMin),
    queueLength: row.queueLength,
    joinedAt: new Date(row.joinedAt).toISOString(),
  };
}

// Member 4's modules. They run only after the database change has been committed.
async function recordHistory(userId, service, action, outcome) {
  await addHistoryRecord(userId, {
    action,
    outcome,
    serviceId: service.id,
    service: service.name,
    date: new Date().toLocaleDateString('en-CA'), // local YYYY-MM-DD, not UTC
  });
}

async function notify(userId, message) {
  await addNotification(userId, message);
}

// Each user's "almost ready" flag is set inside the queue transaction, so it fires once.
async function sendAlmostReady(service, claimed) {
  for (const { userId, position } of claimed) {
    await notify(userId, `You're almost up for ${service.name}. You are number ${position} in line.`);
  }
}

async function joinQueue(userId, serviceId) {
  const id = validateUserId(userId);
  const service = await getServiceById(serviceId);
  if (service.status !== 'open') throw new AppError('This queue is closed', 409);

  const { entry, claimed } = await repo.transaction(async (client) => {
    await repo.lockService(client, service.id);
    const existing = await repo.findWaitingByUser(client, id);
    if (existing) throw alreadyQueued(existing.serviceId === service.id);
    const queueId = await repo.ensureQueue(client, service.id);
    let created;
    try {
      created = await repo.insertEntry(client, queueId, id, PRIORITY_RANK[service.priority]);
    } catch (error) {
      // Two simultaneous joins by one user: the unique index lets only one through.
      if (error.code === '23505') throw alreadyQueued(true);
      throw error;
    }
    return {
      entry: await repo.describeEntry(client, created.entryId),
      claimed: await repo.claimAlmostReady(client, service.id, ALMOST_READY_POSITION),
    };
  });

  const result = describeEntry(entry, service);
  await recordHistory(id, service, 'joined_queue', 'Joined');
  await notify(id, `You joined ${service.name}. You are number ${result.position}; estimated wait is ${result.estimatedWaitMin} minutes.`);
  await sendAlmostReady(service, claimed);
  return result;
}

function alreadyQueued(sameQueue) {
  return new AppError(
    sameQueue
      ? 'You are already in this queue'
      : 'You are already in another queue. Leave it before joining a new one',
    409,
  );
}

async function leaveQueue(userId, serviceId) {
  const id = validateUserId(userId);
  const service = await getServiceById(serviceId);

  const claimed = await repo.transaction(async (client) => {
    await repo.lockService(client, service.id);
    const entry = await repo.findWaitingByUser(client, id);
    if (!entry || entry.serviceId !== service.id) throw new AppError('You are not in this queue', 404);
    await repo.cancelEntry(client, entry.entryId);
    return repo.claimAlmostReady(client, service.id, ALMOST_READY_POSITION); // people behind may now be close
  });

  await recordHistory(id, service, 'left_queue', 'Left queue');
  await notify(id, `You left the ${service.name} queue.`);
  await sendAlmostReady(service, claimed);
  return { serviceId: service.id, serviceName: service.name, left: true };
}

// The logged-in user's own status: still waiting, or just served, or neither.
async function getCurrentQueue(userId) {
  const id = validateUserId(userId);
  const entry = await repo.findWaitingByUser(null, id);
  if (entry) {
    return { currentQueue: describeEntry(entry, await getServiceById(entry.serviceId)), lastServed: null };
  }
  const last = await repo.lastFinished(id);
  if (!last || last.status !== 'served') return { currentQueue: null, lastServed: null };
  const service = await getServiceById(last.serviceId);
  return {
    currentQueue: null,
    lastServed: { serviceId: service.id, serviceName: service.name, servedAt: new Date(last.endedAt).toISOString() },
  };
}

// Admin view of one service's queue, in serving order.
async function getQueue(serviceId) {
  const service = await getServiceById(serviceId);
  const ordered = await repo.listWaiting(service.id);
  return {
    service: {
      id: service.id,
      name: service.name,
      status: service.status,
      priority: service.priority,
      durationMin: service.durationMin,
    },
    length: ordered.length,
    queue: ordered.map((row) => ({
      entryId: row.entryId,
      userId: row.userId,
      email: emailFor(row.userId),
      priority: PRIORITY_NAME[row.priorityRank],
      joinedAt: new Date(row.joinedAt).toISOString(),
      position: row.position,
      status: statusForPosition(row.position),
      estimatedWaitMin: calculateWaitTime(row.position, service.durationMin),
    })),
  };
}

async function serveNext(serviceId) {
  const service = await getServiceById(serviceId);

  const { next, claimed } = await repo.transaction(async (client) => {
    await repo.lockService(client, service.id);
    const served = await repo.serveFirst(client, service.id);
    if (!served) throw new AppError('No one is waiting in this queue', 409);
    return { next: served, claimed: await repo.claimAlmostReady(client, service.id, ALMOST_READY_POSITION) };
  });

  await recordHistory(next.userId, service, 'served', 'Served');
  await notify(next.userId, `It's your turn at ${service.name}. You have been served.`);
  await sendAlmostReady(service, claimed);
  return {
    served: {
      userId: next.userId,
      email: emailFor(next.userId),
      priority: PRIORITY_NAME[next.priorityRank],
      joinedAt: new Date(next.joinedAt).toISOString(),
    },
    queueLength: (await repo.listWaiting(service.id)).length,
  };
}

// Per-service size and the wait a new joiner would face (used by the Join Queue screen).
async function getQueueSummaries() {
  const [services, counts] = await Promise.all([listServices(), repo.countWaiting()]);
  return Promise.all(services.map(async (service) => {
    const ahead = await repo.countWaitingAtOrAbove(service.id, PRIORITY_RANK[service.priority]);
    return {
      serviceId: service.id,
      queueLength: counts.get(service.id) || 0,
      estimatedWaitMin: calculateWaitTime(ahead + 1, service.durationMin),
    };
  }));
}

// Test helper: empties every queue.
async function resetQueues() {
  await repo.clearAll();
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
