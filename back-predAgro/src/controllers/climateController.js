const climateService = require('../services/climateService');

async function ingestRecord(req, res) {
  const record = await climateService.ingestRecord(req.user.id, req.body);

  res.status(201).json({
    record,
  });
}

async function listRecords(req, res) {
  const records = await climateService.listByUserId(req.user.id);

  res.status(200).json({
    records,
  });
}

module.exports = {
  ingestRecord,
  listRecords,
};
