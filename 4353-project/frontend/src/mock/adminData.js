// Admin-only mock queue data (kept separate from mock/data.js so we don't collide with teammates).
const names = [
  "Ava Johnson", "Liam Chen", "Noah Patel", "Mia Garcia", "Ethan Brown",
  "Sofia Nguyen", "Lucas Martin", "Zoe Williams", "Owen Davis", "Chloe Lopez",
];

function makeQueue(serviceId, count) {
  return Array.from({ length: count }, (_, i) => {
    const name = names[(i + serviceId * 3) % names.length];
    return {
      id: `${serviceId}-${i + 1}`,
      name,
      email: `${name.toLowerCase().replace(" ", ".")}@queuesmart.test`,
      joinedAt: `${9 + Math.floor(i / 2)}:${i % 2 === 0 ? "05" : "40"} AM`,
    };
  });
}

// Keys are service ids from mock/data.js; lengths match each service's queueLength.
export const seedQueues = {
  1: makeQueue(1, 4),
  2: makeQueue(2, 7),
  3: makeQueue(3, 0),
};
