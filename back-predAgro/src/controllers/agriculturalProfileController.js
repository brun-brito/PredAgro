const agriculturalProfileService = require('../services/agriculturalProfileService');

async function getMyProfile(req, res) {
  const profile = await agriculturalProfileService.getByUserId(req.user.id);

  res.status(200).json({
    profile,
  });
}

async function updateMyProfile(req, res) {
  const profile = await agriculturalProfileService.updateByUserId(req.user.id, req.body);

  res.status(200).json({
    profile,
  });
}

module.exports = {
  getMyProfile,
  updateMyProfile,
};
