const AppError = require('../utils/AppError');
const repository = require('../repositories/serviceRepository');
const { getQueueLength } = require('./queueCountService');

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

function validateId(id) {
  if (!/^[1-9]\d*$/.test(String(id)) || !Number.isSafeInteger(Number(id))) {
    throw new AppError('Service id must be a positive integer', 400);
  }
  return Number(id);
}

async function withQueueLength(service) {
  return { ...service, queueLength: await getQueueLength(service.id) };
}

async function getServiceById(id) {
  const serviceId = validateId(id);
  // PostgreSQL INTEGER is bounded; larger valid numeric IDs simply do not exist.
  const service = serviceId <= 2147483647 ? await repository.find(serviceId) : undefined;
  if (!service) throw new AppError('Service not found', 404);
  return withQueueLength(service);
}

function databaseError(error) {
  if (error.code === '23505' && error.constraint === 'service_name_unique') {
    return new AppError('A service with this name already exists', 409);
  }
  return error;
}

async function listServices() {
  return Promise.all((await repository.list()).map(withQueueLength));
}

async function createService(input) {
  const data = validateFields(input);
  try {
    return await withQueueLength(await repository.create(data));
  } catch (error) {
    throw databaseError(error);
  }
}

async function updateService(id, input) {
  const serviceId = validateId(id);
  const data = validateFields(input, true);
  if (serviceId > 2147483647) throw new AppError('Service not found', 404);
  try {
    const service = await repository.update(serviceId, data);
    if (!service) throw new AppError('Service not found', 404);
    return await withQueueLength(service);
  } catch (error) {
    throw databaseError(error);
  }
}

module.exports = { listServices, getServiceById, createService, updateService };
