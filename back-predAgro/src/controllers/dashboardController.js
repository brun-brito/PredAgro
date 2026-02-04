const dashboardService = require('../services/dashboardService');

async function getOverview(req, res) {
  const overview = await dashboardService.getOverview(req.user.id);

  res.status(200).json(overview);
}

module.exports = {
  getOverview,
};
