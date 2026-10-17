const { calculateWaitTime } = require('../services/waitTimeService');

describe('shared wait-time calculation', () => {
  test.each([[0, 10, 0], [1, 10, 10], [3, 10, 30], [7, 15, 105], [2, 480, 960]])(
    'position %s with %s minute service estimates %s minutes', (position, duration, expected) => {
      expect(calculateWaitTime(position, duration)).toBe(expected);
    },
  );
  test.each([-1, 1.5, '2', NaN, Infinity, null, undefined, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid position %p', (position) => {
      expect(() => calculateWaitTime(position, 10)).toThrow(expect.objectContaining({ statusCode: 400 }));
    },
  );
  test.each([0, -1, 481, 1.5, '10', NaN, Infinity, null, undefined])(
    'rejects invalid duration %p', (duration) => {
      expect(() => calculateWaitTime(2, duration)).toThrow(expect.objectContaining({ statusCode: 400 }));
    },
  );
  test('rejects a result outside the safe integer range', () => {
    expect(() => calculateWaitTime(Number.MAX_SAFE_INTEGER, 480)).toThrow(expect.objectContaining({ statusCode: 400 }));
  });
});
