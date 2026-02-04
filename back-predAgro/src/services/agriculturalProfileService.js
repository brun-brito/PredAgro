const profileRepository = require('../repositories/profileRepository');
const {
  optionalString,
  requireNumber,
  requireStringList,
} = require('../utils/validators');

async function getByUserId(userId) {
  return profileRepository.findByUserId(userId);
}

async function updateByUserId(userId, payload) {
  const farmName = optionalString(payload.farmName) ?? 'Propriedade sem nome';
  const city = optionalString(payload.city) ?? 'Cidade não informada';
  const state = optionalString(payload.state) ?? 'Estado não informado';

  const cropTypes = payload.cropTypes
    ? requireStringList(payload.cropTypes, 'cropTypes')
    : ['Soja'];

  const areaHectares = requireNumber(payload.areaHectares ?? 1, 'areaHectares', 0.1, 10000);

  return profileRepository.upsert(userId, {
    farmName,
    city,
    state,
    cropTypes,
    areaHectares,
  });
}

module.exports = {
  getByUserId,
  updateByUserId,
};
