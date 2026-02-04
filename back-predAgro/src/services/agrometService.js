const availableSources = [
  {
    id: 'inmet',
    name: 'INMET',
    type: 'público',
    status: 'pronto para integração',
  },
  {
    id: 'cptec',
    name: 'CPTEC/INPE',
    type: 'público',
    status: 'pronto para integração',
  },
];

function listSources() {
  return availableSources;
}

function getLatestSnapshot(region = 'Triângulo Mineiro') {
  const currentHour = new Date().getHours();
  const thermalShift = currentHour >= 12 && currentHour <= 16 ? 4 : 0;

  return {
    region,
    temperatureCelsius: 26 + thermalShift,
    rainMillimeters: currentHour % 2 === 0 ? 7 : 3,
    humidity: currentHour % 2 === 0 ? 68 : 55,
    windSpeedKmh: 11 + (currentHour % 3),
    collectedAt: new Date().toISOString(),
  };
}

module.exports = {
  listSources,
  getLatestSnapshot,
};
