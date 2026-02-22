import { getCache, setCache } from '../utils/cache';

const GEO_TTL = 7 * 24 * 60 * 60 * 1000;
const GEO_TIMEOUT = 6000;

const cacheKey = (city: string, state: string) =>
  `geo:city:${city.trim().toLowerCase()}:${state.trim().toLowerCase()}`;

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
      const query = `${normalizedCity}, ${normalizedState}, Brasil`;
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=pt&format=json`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error('Não foi possível consultar a localização da cidade.');
      }

      const data = (await response.json()) as {
        results?: Array<{ latitude: number; longitude: number }>;
      };

      if (!data.results || data.results.length === 0) {
        throw new Error('Cidade não encontrada para o estado informado.');
      }

      const result = data.results[0];
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
