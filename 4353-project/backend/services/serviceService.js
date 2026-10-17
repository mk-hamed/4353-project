const AppError = require('../utils/AppError');
const { services } = require('../mock/data');

const EDITABLE_FIELDS = ['name', 'description', 'durationMin', 'priority', 'status'];

function validateFields(input, partial = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AppError('Service data must be a JSON object', 400);
  }
  const keys = Object.keys(input);
  if (!keys.length || keys.some((key) => !EDITABLE_FIELDS.includes(key))) {
    throw new AppError('Provide supported service fields: name, description, durationMin, priority, status', 400);
  }
  const result = {};
  for (const [field, limit] of [['name', 100], ['description', 500]]) {
    if (partial && !Object.hasOwn(input, field)) continue;
    if (typeof input[field] !== 'string' || !input[field].trim()) {
      throw new AppError(`${field} must be a non-empty string`, 400);
    }
    result[field] = input[field].trim();
    if (result[field].length > limit) {
      throw new AppError(`${field} must be ${limit} characters or fewer`, 400);
    }
  }
  if (!partial || Object.hasOwn(input, 'durationMin')) {
    if (!Number.isInteger(input.durationMin) || input.durationMin < 1 || input.durationMin > 480) {
      throw new AppError('durationMin must be a whole number between 1 and 480', 400);
    }
    result.durationMin = input.durationMin;
  }
  if (!partial || Object.hasOwn(input, 'priority')) {
    if (!['low', 'medium', 'high'].includes(input.priority)) {
      throw new AppError('priority must be low, medium, or high', 400);
    }
    result.priority = input.priority;
  }
  if (Object.hasOwn(input, 'status')) {
    if (!['open', 'closed'].includes(input.status)) {
      throw new AppError('status must be open or closed', 400);
    }
    result.status = input.status;
  }
  return result;
}

function getServiceById(id) {
  if (!/^[1-9]\d*$/.test(String(id)) || !Number.isSafeInteger(Number(id))) {
    throw new AppError('Service id must be a positive integer', 400);
  }
  const service = services.find((item) => item.id === Number(id));
  if (!service) throw new AppError('Service not found', 404);
  return { ...service };
}

function checkUniqueName(name, excludeId) {
  if (services.some((item) => item.id !== excludeId && item.name.toLowerCase() === name.toLowerCase())) {
    throw new AppError('A service with this name already exists', 409);
  }
}

function listServices() {
  return services.map((service) => ({ ...service }));
}

function createService(input) {
  const data = validateFields(input);
  checkUniqueName(data.name);
  const service = {
    id: Math.max(0, ...services.map((item) => item.id)) + 1,
    status: 'open',
    ...data,
    queueLength: 0,
  };
  services.push(service);
  return { ...service };
}

// Partial updates let the dashboard change status without overwriting other fields.
function updateService(id, input) {
  const existing = getServiceById(id);
  const data = validateFields(input, true);
  if (data.name !== undefined) checkUniqueName(data.name, existing.id);
  const service = services.find((item) => item.id === existing.id);
  Object.assign(service, data);
  return { ...service };
}

module.exports = { listServices, getServiceById, createService, updateService };
