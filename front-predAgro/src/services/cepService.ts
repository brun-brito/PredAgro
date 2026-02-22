import { getCache, setCache } from '../utils/cache';

export interface CepLookupResult {
  cep: string;
  city: string;
  state: string;
  neighborhood?: string;
  street?: string;
}

const CEP_TTL = 24 * 60 * 60 * 1000;
const CEP_TIMEOUT = 6000;

const cacheKey = (cep: string) => `cep:${cep}`;

function normalizeCep(value: string) {
  return value.replace(/\D/g, '').slice(0, 8);
}

export const cepService = {
  normalize: normalizeCep,
  lookup: async (rawCep: string): Promise<CepLookupResult> => {
    const cep = normalizeCep(rawCep);
    if (cep.length !== 8) {
      throw new Error('Informe um CEP válido com 8 dígitos.');
    }

    const cached = getCache<CepLookupResult>(cacheKey(cep));
    if (cached) {
      return cached;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CEP_TIMEOUT);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Não foi possível consultar o CEP.');
      }

      const data = (await response.json()) as {
        cep?: string;
        localidade?: string;
        uf?: string;
        bairro?: string;
        logradouro?: string;
        erro?: boolean;
      };

      if (data.erro) {
        throw new Error('CEP não encontrado.');
      }

      const result: CepLookupResult = {
        cep: normalizeCep(data.cep ?? cep),
        city: data.localidade ?? '',
        state: data.uf ?? '',
        neighborhood: data.bairro ?? '',
        street: data.logradouro ?? '',
      };

      if (!result.city || !result.state) {
        throw new Error('CEP encontrado sem cidade ou UF.');
      }

      setCache(cacheKey(cep), result, CEP_TTL);
      return result;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Tempo de resposta excedido ao buscar o CEP.');
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Não foi possível consultar o CEP.');
    } finally {
      clearTimeout(timeout);
    }
  },
};
