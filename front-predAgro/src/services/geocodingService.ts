import { getCache, setCache } from '../utils/cache';

const GEO_TTL = 7 * 24 * 60 * 60 * 1000;
const GEO_TIMEOUT = 6000;
const BRAZILIAN_STATE_NAMES: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapa',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceara',
  DF: 'Distrito Federal',
  ES: 'Espirito Santo',
  GO: 'Goias',
  MA: 'Maranhao',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Para',
  PB: 'Paraiba',
  PR: 'Parana',
  PE: 'Pernambuco',
  PI: 'Piaui',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondonia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'Sao Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

const cacheKey = (city: string, state: string) =>
  `geo:city:${city.trim().toLowerCase()}:${state.trim().toLowerCase()}`;

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function resolveStateAliases(state: string) {
  const normalizedState = normalizeText(state);
  const stateCode = state.trim().toUpperCase();
  const aliases = new Set<string>([normalizedState]);
  const fullName = BRAZILIAN_STATE_NAMES[stateCode];

  if (fullName) {
    aliases.add(normalizeText(fullName));
  }

  return aliases;
}

export const geocodingService = {
  lookupCityState: async (city: string, state: string): Promise<[number, number]> => {
    const normalizedCity = city.trim();
    const normalizedState = state.trim();

    if (!normalizedCity || !normalizedState) {
      throw new Error('Informe cidade e UF para localizar no mapa.');
    }

    const key = cacheKey(normalizedCity, normalizedState);
    const cached = getCache<{ center: [number, number] }>(key);
    if (cached) {
      return cached.center;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEO_TIMEOUT);

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          normalizedCity
        )}&count=10&language=pt&format=json&countryCode=BR`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error('Não foi possível consultar a localização da cidade.');
      }

      const data = (await response.json()) as {
        results?: Array<{
          latitude: number;
          longitude: number;
          admin1?: string;
        }>;
      };

      if (!data.results || data.results.length === 0) {
        throw new Error('Cidade não encontrada para o estado informado.');
      }

      const stateAliases = resolveStateAliases(normalizedState);
      const result = data.results.find((item) => {
        if (!item.admin1) {
          return false;
        }

        return stateAliases.has(normalizeText(item.admin1));
      });

      if (!result) {
        throw new Error('Cidade não encontrada para o estado informado.');
      }

      const center: [number, number] = [result.latitude, result.longitude];
      setCache(key, { center }, GEO_TTL);
      return center;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Tempo de resposta excedido ao buscar a cidade.');
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Não foi possível consultar a localização.');
    } finally {
      clearTimeout(timeout);
    }
  },
};
