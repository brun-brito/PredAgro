const agriculturalProfileService = require('../services/agriculturalProfileService');
const climateService = require('../services/climateService');
const agrometService = require('../services/agrometService');
const predictionService = require('../services/predictionService');

async function getSummary(req, res) {
  const profile = await agriculturalProfileService.getByUserId(req.user.id);

  const latestClimate =
    (await climateService.findLatestByUserId(req.user.id)) ??
    agrometService.getLatestSnapshot(profile?.state ?? 'Triângulo Mineiro');

  const summary = predictionService.buildSummary(profile, latestClimate);

  res.status(200).json({
    summary,
  });
}

module.exports = {
  getSummary,
};
