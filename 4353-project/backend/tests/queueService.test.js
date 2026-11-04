const { services, queueEntries } = require('../mock/data');
const { updateService, getServiceById } = require('../services/serviceService');
const queue = require('../services/queueService');
const { getNotifications } = require('../services/notificationService');
const { getHistory } = require('../services/historyService');

// Service 1: Student Inquiries, 10 min, medium, open. Service 2: 15 min, high. Service 3: closed.
const setPriority = (id, priority) => updateService(id, { priority });
const setStatus = (id, status) => updateService(id, { status });
const messages = (userId) => getNotifications(userId).map((n) => n.message);
const actions = (userId) => getHistory(userId).map((h) => h.record.action);

describe('seed data', () => {
  test('each service queueLength matches its real queue before any change', async () => {
    for (const service of services) {
      expect((await queue.getQueue(service.id)).length).toBe(service.queueLength);
    }
    expect((await queue.getQueue(1)).length).toBe(4);
    expect((await queue.getQueue(2)).length).toBe(7);
  });
});

describe('queueService', () => {
  beforeEach(async () => {
    queue.resetQueues();
    await setPriority(1, 'medium');
    await setPriority(2, 'high');
    await setStatus(1, 'open');
    await setStatus(3, 'closed');
  });

  describe('joinQueue', () => {
    test('puts the user in line with position, status and estimated wait', async () => {
      const result = await queue.joinQueue(101, 1);
      expect(result).toMatchObject({
        serviceId: 1, serviceName: 'Student Inquiries', position: 1,
        status: 'almost-ready', estimatedWaitMin: 10, queueLength: 1
      });
    });

    test('estimates wait as position x service duration using the shared function', async () => {
      for (const id of [201, 202, 203]) {
        await queue.joinQueue(id, 1);
      }
      const fourth = await queue.joinQueue(204, 1);
      expect(fourth.position).toBe(4);
      expect(fourth.estimatedWaitMin).toBe(40);
      expect(fourth.status).toBe('waiting');
    });

    test('keeps the service queueLength in sync', async () => {
      await queue.joinQueue(101, 1);
      await queue.joinQueue(102, 1);
      expect((await getServiceById(1)).queueLength).toBe(2);
    });

    test('accepts a numeric string service id', async () => {
      expect((await queue.joinQueue(101, '1')).serviceId).toBe(1);
    });

    test.each(['abc', '0', '-1', '1.5', '', null, undefined])('rejects invalid service id %p with 400', async (id) => {
      await expect(queue.joinQueue(101, id)).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    test('rejects an unknown service with 404', async () => {
      await expect(queue.joinQueue(101, 999)).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    test.each(['', '  ', null, undefined, {}])('rejects invalid user id %p with 400', async (userId) => {
      await expect(queue.joinQueue(userId, 1)).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    test('rejects a closed queue with 409 and leaves it empty', async () => {
      await expect(queue.joinQueue(101, 3)).rejects.toThrow(expect.objectContaining({ statusCode: 409, message: 'This queue is closed' }));
      expect((await queue.getQueue(3)).length).toBe(0);
    });

    test('rejects joining the same queue twice with 409', async () => {
      await queue.joinQueue(101, 1);
      await expect(queue.joinQueue(101, 1)).rejects.toThrow(expect.objectContaining({ statusCode: 409, message: 'You are already in this queue' }));
      expect((await queue.getQueue(1)).length).toBe(1);
    });

    test('rejects joining a second queue while in one with 409', async () => {
      await queue.joinQueue(101, 1);
      await expect(queue.joinQueue(101, 2)).rejects.toThrow(expect.objectContaining({ statusCode: 409 }));
    });

    test('records history and sends a joined notification', async () => {
      await queue.joinQueue(171, 1);
      expect(getHistory(171)[0].record).toMatchObject({
        action: 'joined_queue', outcome: 'Joined', serviceId: 1, service: 'Student Inquiries'
      });
      expect(messages(171)[0]).toMatch(/You joined Student Inquiries.*number 1.*10 minutes/);
    });
  });

  describe('ordering (priority, then arrival)', () => {
    test('same priority is first come, first served', async () => {
      await queue.joinQueue(101, 1);
      await queue.joinQueue(102, 1);
      await queue.joinQueue(103, 1);
      expect((await queue.getQueue(1)).queue.map((e) => e.userId)).toEqual([101, 102, 103]);
    });

    test('a higher-priority entry is served before earlier lower-priority ones', async () => {
      await queue.joinQueue(101, 1); // medium
      await queue.joinQueue(102, 1); // medium
      await setPriority(1, 'high');
      const late = await queue.joinQueue(103, 1); // high, arrives last
      expect(late.position).toBe(1);
      expect((await queue.getQueue(1)).queue.map((e) => e.userId)).toEqual([103, 101, 102]);
      expect((await queue.serveNext(1)).served.userId).toBe(103);
    });

    test('a lower-priority latecomer stays behind', async () => {
      await queue.joinQueue(101, 1); // medium
      await setPriority(1, 'low');
      const late = await queue.joinQueue(102, 1);
      expect(late.position).toBe(2);
    });

    test('ties inside the same priority fall back to arrival order', async () => {
      await setPriority(1, 'high');
      await queue.joinQueue(101, 1);
      await setPriority(1, 'medium');
      await queue.joinQueue(102, 1);
      await setPriority(1, 'high');
      await queue.joinQueue(103, 1);
      expect((await queue.getQueue(1)).queue.map((e) => e.userId)).toEqual([101, 103, 102]);
    });

    test('does not reorder the stored array when reading a queue', async () => {
      await queue.joinQueue(101, 1);
      await setPriority(1, 'high');
      await queue.joinQueue(102, 1);
      const before = queueEntries.map((e) => e.userId);
      await queue.getQueue(1);
      expect(queueEntries.map((e) => e.userId)).toEqual(before);
    });
  });

  describe('almost-ready notifications', () => {
    test('notifies positions 1 and 2 but not position 3', async () => {
      for (const id of [181, 182, 183]) {
        await queue.joinQueue(id, 1);
      }
      expect(messages(181).some((m) => m.includes('almost up'))).toBe(true);
      expect(messages(182).some((m) => m.includes('almost up'))).toBe(true);
      expect(messages(183).some((m) => m.includes('almost up'))).toBe(false);
    });

    test('notifies a user once when they move up to position 2', async () => {
      for (const id of [111, 112, 113]) {
        await queue.joinQueue(id, 1);
      }
      expect(messages(113).filter((m) => m.includes('almost up'))).toHaveLength(0);
      await queue.serveNext(1);
      expect(messages(113).filter((m) => m.includes('almost up'))).toHaveLength(1);
      await queue.leaveQueue(112, 1);
      expect(messages(113).filter((m) => m.includes('almost up'))).toHaveLength(1);
    });

    test('also notifies when someone ahead leaves', async () => {
      for (const id of [121, 122, 123]) {
        await queue.joinQueue(id, 1);
      }
      await queue.leaveQueue(121, 1);
      expect(messages(123).some((m) => m.includes('almost up') && m.includes('number 2'))).toBe(true);
    });
  });

  describe('leaveQueue', () => {
    test('removes the user, shifts positions and updates queueLength', async () => {
      await queue.joinQueue(101, 1);
      await queue.joinQueue(102, 1);
      expect(await queue.leaveQueue(101, 1)).toMatchObject({ serviceId: 1, left: true });
      expect((await queue.getCurrentQueue(102)).currentQueue.position).toBe(1);
      expect((await getServiceById(1)).queueLength).toBe(1);
    });

    test('records history and sends a notification', async () => {
      await queue.joinQueue(131, 1);
      await queue.leaveQueue(131, 1);
      expect(actions(131)).toEqual(['joined_queue', 'left_queue']);
      expect(getHistory(131)[1].record.outcome).toBe('Left queue');
      expect(messages(131).at(-1)).toMatch(/You left/);
    });

    test('lets the user join again afterwards', async () => {
      await queue.joinQueue(101, 1);
      await queue.leaveQueue(101, 1);
      expect((await queue.joinQueue(101, 2)).serviceId).toBe(2);
    });

    test('rejects leaving a queue the user is not in with 404', async () => {
      await expect(queue.leaveQueue(101, 1)).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    test('rejects leaving a different service than the one joined', async () => {
      await queue.joinQueue(101, 1);
      await expect(queue.leaveQueue(101, 2)).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
      expect((await queue.getCurrentQueue(101)).currentQueue.serviceId).toBe(1);
    });

    test('validates ids', async () => {
      await expect(queue.leaveQueue(101, 'abc')).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
      await expect(queue.leaveQueue(101, 999)).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
      await expect(queue.leaveQueue('', 1)).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('serveNext', () => {
    test('serves the first user and advances everyone else', async () => {
      await queue.joinQueue(141, 1);
      await queue.joinQueue(142, 1);
      const result = await queue.serveNext(1);
      expect(result.served.userId).toBe(141);
      expect(result.queueLength).toBe(1);
      expect((await queue.getCurrentQueue(142)).currentQueue.position).toBe(1);
      expect((await getServiceById(1)).queueLength).toBe(1);
    });

    test('records Served history and notifies the served user', async () => {
      await queue.joinQueue(151, 1);
      await queue.serveNext(1);
      expect(actions(151)).toEqual(['joined_queue', 'served']);
      expect(getHistory(151)[1].record.outcome).toBe('Served');
      expect(messages(151).at(-1)).toMatch(/been served/);
    });

    test('reports the served user as lastServed until they join again', async () => {
      await queue.joinQueue(161, 1);
      await queue.serveNext(1);
      expect(await queue.getCurrentQueue(161)).toMatchObject({
        currentQueue: null,
        lastServed: { serviceId: 1, serviceName: 'Student Inquiries' }
      });
      await queue.joinQueue(161, 2);
      expect((await queue.getCurrentQueue(161)).lastServed).toBeNull();
    });

    test('rejects an empty queue with 409', async () => {
      await expect(queue.serveNext(1)).rejects.toThrow(expect.objectContaining({ statusCode: 409 }));
    });

    test('validates the service id', async () => {
      await expect(queue.serveNext('abc')).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
      await expect(queue.serveNext(999)).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    test('still serves people already waiting when the queue is closed', async () => {
      await queue.joinQueue(101, 1);
      await setStatus(1, 'closed');
      expect((await queue.serveNext(1)).served.userId).toBe(101);
    });
  });

  describe('getCurrentQueue', () => {
    test('is empty for a user who never joined', async () => {
      expect(await queue.getCurrentQueue(999)).toEqual({ currentQueue: null, lastServed: null });
    });

    test('rejects a missing user id', async () => {
      await expect(queue.getCurrentQueue(undefined)).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('getQueue (admin view)', () => {
    test('lists users in serving order with position and wait', async () => {
      await queue.joinQueue(101, 1);
      await queue.joinQueue(102, 1);
      const view = await queue.getQueue(1);
      expect(view.service).toMatchObject({ id: 1, name: 'Student Inquiries', durationMin: 10 });
      expect(view.length).toBe(2);
      expect(view.queue[1]).toMatchObject({ userId: 102, position: 2, estimatedWaitMin: 20, priority: 'medium' });
    });

    test('is empty for a service nobody joined', async () => {
      expect(await queue.getQueue(2)).toMatchObject({ length: 0, queue: [] });
    });
  });

  describe('getQueueSummaries', () => {
    test('returns length and the wait a new joiner would face', async () => {
      await queue.joinQueue(101, 1);
      const summary = (await queue.getQueueSummaries()).find((s) => s.serviceId === 1);
      expect(summary).toEqual({ serviceId: 1, queueLength: 1, estimatedWaitMin: 20 });
      expect((await queue.getQueueSummaries()).find((s) => s.serviceId === 2)).toEqual({ serviceId: 2, queueLength: 0, estimatedWaitMin: 15 });
    });

    test('a higher-priority newcomer would skip lower-priority entries', async () => {
      await queue.joinQueue(101, 1);
      await setPriority(1, 'high');
      expect((await queue.getQueueSummaries()).find((s) => s.serviceId === 1).estimatedWaitMin).toBe(10);
    });
  });
});
