const agrometService = require('../services/agrometService');

async function listSources(req, res) {
  const sources = agrometService.listSources();

  res.status(200).json({
    sources,
  });
}

async function getLatest(req, res) {
  const region = req.query.region;
  const snapshot = agrometService.getLatestSnapshot(region);

  res.status(200).json({
    snapshot,
  });
}

module.exports = {
  listSources,
  getLatest,
};
