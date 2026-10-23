import { apiRequest } from "../api/client.js";

// Queue endpoints (Member 3). apiRequest adds the saved login token and turns
// backend { error } responses into thrown Errors with a readable message.
const id = (serviceId) => encodeURIComponent(serviceId);

// Everyone signed in
export const getQueueSummaries = () => apiRequest("/api/queues");

// Users
export const getCurrentQueue = () => apiRequest("/api/queues/current");
export const joinQueue = (serviceId) =>
  apiRequest(`/api/queues/${id(serviceId)}/join`, { method: "POST" });
export const leaveQueue = (serviceId) =>
  apiRequest(`/api/queues/${id(serviceId)}/leave`, { method: "POST" });

// Admins
export const getQueue = (serviceId) => apiRequest(`/api/queues/${id(serviceId)}`);
export const serveNext = (serviceId) =>
  apiRequest(`/api/queues/${id(serviceId)}/serve-next`, { method: "POST" });
