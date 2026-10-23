const { services, queueEntries } = require('../mock/data');
const queue = require('../services/queueService');
const { getNotifications } = require('../services/notificationService');
const { getHistory } = require('../services/historyService');

// Service 1: Student Inquiries, 10 min, medium, open. Service 2: 15 min, high. Service 3: closed.
const setPriority = (id, priority) => { services.find((s) => s.id === id).priority = priority; };
const setStatus = (id, status) => { services.find((s) => s.id === id).status = status; };
const messages = (userId) => getNotifications(userId).map((n) => n.message);
const actions = (userId) => getHistory(userId).map((h) => h.record.action);

describe('seed data', () => {
  test('each service queueLength matches its real queue before any change', () => {
    services.forEach((service) => {
      expect(queue.getQueue(service.id).length).toBe(service.queueLength);
    });
    expect(queue.getQueue(1).length).toBe(4);
    expect(queue.getQueue(2).length).toBe(7);
  });
});

describe('queueService', () => {
  beforeEach(() => {
    queue.resetQueues();
    setPriority(1, 'medium');
    setPriority(2, 'high');
    setStatus(1, 'open');
    setStatus(3, 'closed');
  });

  describe('joinQueue', () => {
    test('puts the user in line with position, status and estimated wait', () => {
      const result = queue.joinQueue(101, 1);
      expect(result).toMatchObject({
        serviceId: 1, serviceName: 'Student Inquiries', position: 1,
        status: 'almost-ready', estimatedWaitMin: 10, queueLength: 1,
      });
    });

    test('estimates wait as position x service duration using the shared function', () => {
      [201, 202, 203].forEach((id) => queue.joinQueue(id, 1));
      const fourth = queue.joinQueue(204, 1);
      expect(fourth.position).toBe(4);
      expect(fourth.estimatedWaitMin).toBe(40);
      expect(fourth.status).toBe('waiting');
    });

    test('keeps the service queueLength in sync', () => {
      queue.joinQueue(101, 1);
      queue.joinQueue(102, 1);
      expect(services.find((s) => s.id === 1).queueLength).toBe(2);
    });

    test('accepts a numeric string service id', () => {
      expect(queue.joinQueue(101, '1').serviceId).toBe(1);
    });

    test.each(['abc', '0', '-1', '1.5', '', null, undefined])('rejects invalid service id %p with 400', (id) => {
      expect(() => queue.joinQueue(101, id)).toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    test('rejects an unknown service with 404', () => {
      expect(() => queue.joinQueue(101, 999)).toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    test.each(['', '  ', null, undefined, {}])('rejects invalid user id %p with 400', (userId) => {
      expect(() => queue.joinQueue(userId, 1)).toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    test('rejects a closed queue with 409 and leaves it empty', () => {
      expect(() => queue.joinQueue(101, 3)).toThrow(expect.objectContaining({ statusCode: 409, message: 'This queue is closed' }));
      expect(queue.getQueue(3).length).toBe(0);
    });

    test('rejects joining the same queue twice with 409', () => {
      queue.joinQueue(101, 1);
      expect(() => queue.joinQueue(101, 1)).toThrow(expect.objectContaining({ statusCode: 409, message: 'You are already in this queue' }));
      expect(queue.getQueue(1).length).toBe(1);
    });

    test('rejects joining a second queue while in one with 409', () => {
      queue.joinQueue(101, 1);
      expect(() => queue.joinQueue(101, 2)).toThrow(expect.objectContaining({ statusCode: 409 }));
    });

    test('records history and sends a joined notification', () => {
      queue.joinQueue(171, 1);
      expect(getHistory(171)[0].record).toMatchObject({
        action: 'joined_queue', outcome: 'Joined', serviceId: 1, service: 'Student Inquiries',
      });
      expect(messages(171)[0]).toMatch(/You joined Student Inquiries.*number 1.*10 minutes/);
    });
  });

  describe('ordering (priority, then arrival)', () => {
    test('same priority is first come, first served', () => {
      queue.joinQueue(101, 1);
      queue.joinQueue(102, 1);
      queue.joinQueue(103, 1);
      expect(queue.getQueue(1).queue.map((e) => e.userId)).toEqual([101, 102, 103]);
    });

    test('a higher-priority entry is served before earlier lower-priority ones', () => {
      queue.joinQueue(101, 1); // medium
      queue.joinQueue(102, 1); // medium
      setPriority(1, 'high');
      const late = queue.joinQueue(103, 1); // high, arrives last
      expect(late.position).toBe(1);
      expect(queue.getQueue(1).queue.map((e) => e.userId)).toEqual([103, 101, 102]);
      expect(queue.serveNext(1).served.userId).toBe(103);
    });

    test('a lower-priority latecomer stays behind', () => {
      queue.joinQueue(101, 1); // medium
      setPriority(1, 'low');
      const late = queue.joinQueue(102, 1);
      expect(late.position).toBe(2);
    });

    test('ties inside the same priority fall back to arrival order', () => {
      setPriority(1, 'high');
      queue.joinQueue(101, 1);
      setPriority(1, 'medium');
      queue.joinQueue(102, 1);
      setPriority(1, 'high');
      queue.joinQueue(103, 1);
      expect(queue.getQueue(1).queue.map((e) => e.userId)).toEqual([101, 103, 102]);
    });

    test('does not reorder the stored array when reading a queue', () => {
      queue.joinQueue(101, 1);
      setPriority(1, 'high');
      queue.joinQueue(102, 1);
      const before = queueEntries.map((e) => e.userId);
      queue.getQueue(1);
      expect(queueEntries.map((e) => e.userId)).toEqual(before);
    });
  });

  describe('almost-ready notifications', () => {
    test('notifies positions 1 and 2 but not position 3', () => {
      [181, 182, 183].forEach((id) => queue.joinQueue(id, 1));
      expect(messages(181).some((m) => m.includes('almost up'))).toBe(true);
      expect(messages(182).some((m) => m.includes('almost up'))).toBe(true);
      expect(messages(183).some((m) => m.includes('almost up'))).toBe(false);
    });

    test('notifies a user once when they move up to position 2', () => {
      [111, 112, 113].forEach((id) => queue.joinQueue(id, 1));
      expect(messages(113).filter((m) => m.includes('almost up'))).toHaveLength(0);
      queue.serveNext(1);
      expect(messages(113).filter((m) => m.includes('almost up'))).toHaveLength(1);
      queue.leaveQueue(112, 1);
      expect(messages(113).filter((m) => m.includes('almost up'))).toHaveLength(1);
    });

    test('also notifies when someone ahead leaves', () => {
      [121, 122, 123].forEach((id) => queue.joinQueue(id, 1));
      queue.leaveQueue(121, 1);
      expect(messages(123).some((m) => m.includes('almost up') && m.includes('number 2'))).toBe(true);
    });
  });

  describe('leaveQueue', () => {
    test('removes the user, shifts positions and updates queueLength', () => {
      queue.joinQueue(101, 1);
      queue.joinQueue(102, 1);
      expect(queue.leaveQueue(101, 1)).toMatchObject({ serviceId: 1, left: true });
      expect(queue.getCurrentQueue(102).currentQueue.position).toBe(1);
      expect(services.find((s) => s.id === 1).queueLength).toBe(1);
    });

    test('records history and sends a notification', () => {
      queue.joinQueue(131, 1);
      queue.leaveQueue(131, 1);
      expect(actions(131)).toEqual(['joined_queue', 'left_queue']);
      expect(getHistory(131)[1].record.outcome).toBe('Left queue');
      expect(messages(131).at(-1)).toMatch(/You left/);
    });

    test('lets the user join again afterwards', () => {
      queue.joinQueue(101, 1);
      queue.leaveQueue(101, 1);
      expect(queue.joinQueue(101, 2).serviceId).toBe(2);
    });

    test('rejects leaving a queue the user is not in with 404', () => {
      expect(() => queue.leaveQueue(101, 1)).toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    test('rejects leaving a different service than the one joined', () => {
      queue.joinQueue(101, 1);
      expect(() => queue.leaveQueue(101, 2)).toThrow(expect.objectContaining({ statusCode: 404 }));
      expect(queue.getCurrentQueue(101).currentQueue.serviceId).toBe(1);
    });

    test('validates ids', () => {
      expect(() => queue.leaveQueue(101, 'abc')).toThrow(expect.objectContaining({ statusCode: 400 }));
      expect(() => queue.leaveQueue(101, 999)).toThrow(expect.objectContaining({ statusCode: 404 }));
      expect(() => queue.leaveQueue('', 1)).toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('serveNext', () => {
    test('serves the first user and advances everyone else', () => {
      queue.joinQueue(141, 1);
      queue.joinQueue(142, 1);
      const result = queue.serveNext(1);
      expect(result.served.userId).toBe(141);
      expect(result.queueLength).toBe(1);
      expect(queue.getCurrentQueue(142).currentQueue.position).toBe(1);
      expect(services.find((s) => s.id === 1).queueLength).toBe(1);
    });

    test('records Served history and notifies the served user', () => {
      queue.joinQueue(151, 1);
      queue.serveNext(1);
      expect(actions(151)).toEqual(['joined_queue', 'served']);
      expect(getHistory(151)[1].record.outcome).toBe('Served');
      expect(messages(151).at(-1)).toMatch(/been served/);
    });

    test('reports the served user as lastServed until they join again', () => {
      queue.joinQueue(161, 1);
      queue.serveNext(1);
      expect(queue.getCurrentQueue(161)).toMatchObject({
        currentQueue: null,
        lastServed: { serviceId: 1, serviceName: 'Student Inquiries' },
      });
      queue.joinQueue(161, 2);
      expect(queue.getCurrentQueue(161).lastServed).toBeNull();
    });

    test('rejects an empty queue with 409', () => {
      expect(() => queue.serveNext(1)).toThrow(expect.objectContaining({ statusCode: 409 }));
    });

    test('validates the service id', () => {
      expect(() => queue.serveNext('abc')).toThrow(expect.objectContaining({ statusCode: 400 }));
      expect(() => queue.serveNext(999)).toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    test('still serves people already waiting when the queue is closed', () => {
      queue.joinQueue(101, 1);
      setStatus(1, 'closed');
      expect(queue.serveNext(1).served.userId).toBe(101);
    });
  });

  describe('getCurrentQueue', () => {
    test('is empty for a user who never joined', () => {
      expect(queue.getCurrentQueue(999)).toEqual({ currentQueue: null, lastServed: null });
    });

    test('rejects a missing user id', () => {
      expect(() => queue.getCurrentQueue(undefined)).toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('getQueue (admin view)', () => {
    test('lists users in serving order with position and wait', () => {
      queue.joinQueue(101, 1);
      queue.joinQueue(102, 1);
      const view = queue.getQueue(1);
      expect(view.service).toMatchObject({ id: 1, name: 'Student Inquiries', durationMin: 10 });
      expect(view.length).toBe(2);
      expect(view.queue[1]).toMatchObject({ userId: 102, position: 2, estimatedWaitMin: 20, priority: 'medium' });
    });

    test('is empty for a service nobody joined', () => {
      expect(queue.getQueue(2)).toMatchObject({ length: 0, queue: [] });
    });
  });

  describe('getQueueSummaries', () => {
    test('returns length and the wait a new joiner would face', () => {
      queue.joinQueue(101, 1);
      const summary = queue.getQueueSummaries().find((s) => s.serviceId === 1);
      expect(summary).toEqual({ serviceId: 1, queueLength: 1, estimatedWaitMin: 20 });
      expect(queue.getQueueSummaries().find((s) => s.serviceId === 2)).toEqual({ serviceId: 2, queueLength: 0, estimatedWaitMin: 15 });
    });

    test('a higher-priority newcomer would skip lower-priority entries', () => {
      queue.joinQueue(101, 1);
      setPriority(1, 'high');
      expect(queue.getQueueSummaries().find((s) => s.serviceId === 1).estimatedWaitMin).toBe(10);
    });
  });
});
