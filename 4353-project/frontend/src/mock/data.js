export const services = [
  { id: 1, name: "Student Inquiries", description: "General help desk", durationMin: 10, priority: "medium", status: "open", queueLength: 4 },
  { id: 2, name: "Enrollment Support", description: "Course changes and enrollment", durationMin: 15, priority: "high", status: "open", queueLength: 7 },
  { id: 3, name: "IT Helpdesk", description: "Password resets, Wi-Fi", durationMin: 8, priority: "low", status: "closed", queueLength: 0 },
];

// The queue the current user is in (null = not in a queue)
export const currentQueue = { serviceId: 1, position: 3, status: "waiting" };

export const history = [
  { id: 1, date: "2026-09-20", service: "IT Helpdesk", outcome: "Served" },
  { id: 2, date: "2026-09-12", service: "Enrollment Support", outcome: "Left queue" },
];

export const notifications = [
  { id: 1, message: "You're now 3rd in line for Student Inquiries.", read: false },
  { id: 2, message: "IT Helpdesk queue is now closed.", read: true },
];