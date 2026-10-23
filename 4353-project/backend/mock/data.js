const bcrypt = require("bcrypt");

const services = [
  {
    id: 1,
    name: "Student Inquiries",
    description: "General help desk",
    durationMin: 10,
    priority: "medium",
    status: "open",
    queueLength: 4,
  },
  {
    id: 2,
    name: "Enrollment Support",
    description: "Course changes and enrollment",
    durationMin: 15,
    priority: "high",
    status: "open",
    queueLength: 7,
  },
  {
    id: 3,
    name: "IT Helpdesk",
    description: "Password resets, Wi-Fi",
    durationMin: 8,
    priority: "low",
    status: "closed",
    queueLength: 0,
  },
];

const users = [
  {
    id: 1,
    email: "admin@queuesmart.test",
    passwordHash: bcrypt.hashSync("Queue123!", 10),
    role: "admin",
  },
  {
    id: 2,
    email: "user@queuesmart.test",
    passwordHash: bcrypt.hashSync("Queue123!", 10),
    role: "user",
  },
];

// Queue entries (Member 3). One row per user waiting; ordering is computed from
// priority rank + arrival sequence, never from array position. The seed rows make
// each service's queueLength above match a real queue, so the admin screens have
// people to serve in the demo. Seed rows carry demo: true (no notifications/history).
const DEMO_NAMES = [
  'ava.johnson', 'liam.chen', 'noah.patel', 'mia.garcia', 'ethan.brown',
  'sofia.nguyen', 'lucas.martin', 'zoe.williams', 'owen.davis', 'chloe.lopez',
];
const queueEntries = [];
let seedSeq = 1;
services.forEach((service) => {
  for (let i = 0; i < service.queueLength; i += 1) {
    queueEntries.push({
      id: seedSeq,
      seq: seedSeq,
      serviceId: service.id,
      userId: `demo-${service.id}-${i + 1}`,
      email: `${DEMO_NAMES[(i + service.id * 3) % DEMO_NAMES.length]}@queuesmart.test`,
      priority: service.priority,
      joinedAt: new Date(Date.now() - (service.queueLength - i) * 5 * 60000).toISOString(),
      almostReadyNotified: true,
      demo: true,
    });
    seedSeq += 1;
  }
});

// Latest "served" result per user, so the status screen can show "Served".
const servedEntries = [];

module.exports = { services, users, queueEntries, servedEntries };
