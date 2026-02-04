const climateRepository = require('../repositories/climateRepository');
const {
  requireNumber,
  requireString,
} = require('../utils/validators');

async function ingestRecord(userId, payload) {
  const region = requireString(payload.region, 'region', 2);
  const temperatureCelsius = requireNumber(payload.temperatureCelsius, 'temperatureCelsius', -10, 55);
  const rainMillimeters = requireNumber(payload.rainMillimeters, 'rainMillimeters', 0, 600);
  const humidity = requireNumber(payload.humidity, 'humidity', 0, 100);
  const windSpeedKmh = requireNumber(payload.windSpeedKmh, 'windSpeedKmh', 0, 180);

  return climateRepository.create({
    userId,
    region,
    temperatureCelsius,
    rainMillimeters,
    humidity,
    windSpeedKmh,
    collectedAt: new Date().toISOString(),
  });
}

async function listByUserId(userId) {
  return climateRepository.findByUserId(userId);
}

async function findLatestByUserId(userId) {
  return climateRepository.findLatestByUserId(userId);
}

module.exports = {
  ingestRecord,
  listByUserId,
  findLatestByUserId,
};
