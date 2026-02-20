interface AgrometSource {
  id: string;
  name: string;
  type: string;
  status: string;
}

const availableSources: AgrometSource[] = [
  {
    id: 'open-meteo',
    name: 'Open-Meteo',
    type: 'público',
    status: 'ativo',
  },
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

export function listSources() {
  return availableSources;
}
