import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa6';
import { ApiError } from '../services/httpClient';
import { LoadingState } from '../components/ui/LoadingState';
import { farmService } from '../services/farmService';
import { useAuth } from '../hooks/useAuth';
import type { Farm } from '../types/domain';
import styles from './FarmsPage.module.css';

interface FarmFormValues {
  name: string;
  city: string;
  state: string;
}

const initialFormValues: FarmFormValues = {
  name: '',
  city: '',
  state: '',
};

export function FarmsPage() {
  const { token } = useAuth();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [formValues, setFormValues] = useState<FarmFormValues>(initialFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFarms() {
      if (!token) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const response = await farmService.list(token);
        if (isMounted) {
          setFarms(response.farms);
        }
      } catch {
        if (isMounted) {
          setFeedback('Não foi possível carregar as fazendas cadastradas.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFarms();

    return () => {
      isMounted = false;
    };
  }, [token]);

  function updateField(field: keyof FarmFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const response = await farmService.create(token, {
        name: formValues.name,
        city: formValues.city || undefined,
        state: formValues.state || undefined,
      });

      setFarms((current) => [response.farm, ...current]);
      setFormValues(initialFormValues);
    } catch (error) {
      if (error instanceof ApiError) {
        setFeedback(error.message);
      } else {
        setFeedback('Não foi possível salvar a fazenda.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Fazendas</p>
            <h1>Cadastro de fazendas e propriedades</h1>
            <p className={styles.subtitle}>Organize as propriedades para iniciar o cadastro de talhões.</p>
          </div>
          <Link to="/painel" className={styles.backLink}>
            <FaArrowLeft />
            Voltar ao painel
          </Link>
        </header>

        <section className={styles.grid}>
          <div className={styles.card}>
            <h2>Nova fazenda</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <label>
                Nome da fazenda
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  required
                  minLength={3}
                />
              </label>
              <div className={styles.row}>
                <label>
                  Cidade
                  <input
                    type="text"
                    value={formValues.city}
                    onChange={(event) => updateField('city', event.target.value)}
                  />
                </label>
                <label>
                  UF
                  <input
                    type="text"
                    value={formValues.state}
                    onChange={(event) => updateField('state', event.target.value.toUpperCase())}
                    maxLength={2}
                  />
                </label>
              </div>

              {feedback && <p className={styles.feedback}>{feedback}</p>}

              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar fazenda'}
              </button>
            </form>
          </div>

          <div className={styles.card}>
            <h2>Fazendas cadastradas</h2>
            {isLoading ? (
              <div className={styles.loadingBlock}>
                <LoadingState label="Carregando fazendas..." />
              </div>
            ) : (
              <div className={styles.list}>
                {farms.map((farm) => (
                  <Link key={farm.id} to={`/fazendas/${farm.id}`} className={styles.listItem}>
                    <div>
                      <strong>{farm.name}</strong>
                      <span>
                        {farm.city ?? 'Cidade não informada'} {farm.state ? `- ${farm.state}` : ''}
                      </span>
                    </div>
                    <span>Ver talhões</span>
                  </Link>
                ))}
              </div>
            )}

            {!isLoading && farms.length === 0 && <p className={styles.emptyState}>Nenhuma fazenda cadastrada.</p>}
          </div>
        </section>
      </section>
    </main>
  );
}
