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

module.exports = { services, users };
