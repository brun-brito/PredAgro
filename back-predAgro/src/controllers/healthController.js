async function getHealth(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'back-predAgro',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getHealth };
