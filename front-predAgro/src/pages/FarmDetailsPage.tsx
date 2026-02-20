import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa6';
import { ApiError } from '../services/httpClient';
import { farmService } from '../services/farmService';
import { fieldService } from '../services/fieldService';
import { FieldMapEditor } from '../components/maps/FieldMapEditor';
import { LoadingState } from '../components/ui/LoadingState';
import { useAuth } from '../hooks/useAuth';
import type { Field, FieldGeometry, Farm } from '../types/domain';
import styles from './FarmDetailsPage.module.css';

interface FieldFormValues {
  name: string;
  geometry: FieldGeometry | null;
  areaHa: number | null;
}

const initialFieldForm: FieldFormValues = {
  name: '',
  geometry: null,
  areaHa: null,
};

export function FarmDetailsPage() {
  const { farmId } = useParams();
  const { token } = useAuth();

  const [farm, setFarm] = useState<Farm | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [formValues, setFormValues] = useState<FieldFormValues>(initialFieldForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const farmIdValue = useMemo(() => farmId ?? '', [farmId]);

  useEffect(() => {
    let isMounted = true;

    async function loadFarm() {
      if (!token || !farmIdValue) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const [farmResponse, fieldsResponse] = await Promise.all([
          farmService.getById(token, farmIdValue),
          fieldService.listByFarm(token, farmIdValue),
        ]);

        if (isMounted) {
          setFarm(farmResponse.farm);
          setFields(fieldsResponse.fields);
        }
      } catch {
        if (isMounted) {
          setFeedback('Não foi possível carregar os dados da fazenda.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFarm();

    return () => {
      isMounted = false;
    };
  }, [token, farmIdValue]);

  function updateGeometry(geometry: FieldGeometry | null, areaHa: number | null) {
    setFormValues((current) => ({
      ...current,
      geometry,
      areaHa,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !farmIdValue) {
      return;
    }

    if (!formValues.geometry) {
      setFeedback('Desenhe o polígono do talhão antes de salvar.');
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fieldService.create(token, farmIdValue, {
        name: formValues.name,
        geometry: formValues.geometry,
      });

      setFields((current) => [response.field, ...current]);
      setFormValues(initialFieldForm);
    } catch (error) {
      if (error instanceof ApiError) {
        setFeedback(error.message);
      } else {
        setFeedback('Não foi possível salvar o talhão.');
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
            <p className={styles.eyebrow}>Talhões</p>
            <h1>{farm?.name ?? 'Fazenda selecionada'}</h1>
            <p className={styles.subtitle}>Cadastre e acompanhe os talhões da propriedade.</p>
          </div>
          <Link to="/fazendas" className={styles.backLink}>
            <FaArrowLeft />
            Voltar para fazendas
          </Link>
        </header>

        <section className={styles.contentGrid}>
          <div className={styles.card}>
            <h2>Novo talhão</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <label>
                Nome do talhão
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(event) =>
                    setFormValues((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </label>

              <FieldMapEditor geometry={formValues.geometry} onGeometryChange={updateGeometry} />

              <div className={styles.formFooter}>
                <span>
                  Área estimada: {formValues.areaHa ? `${formValues.areaHa.toFixed(2)} ha` : 'Não definida'}
                </span>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar talhão'}
                </button>
              </div>

              {feedback && <p className={styles.feedback}>{feedback}</p>}
            </form>
          </div>

          <div className={styles.card}>
            <h2>Talhões cadastrados</h2>
            {isLoading ? (
              <div className={styles.loadingBlock}>
                <LoadingState label="Carregando talhões..." />
              </div>
            ) : (
              <div className={styles.list}>
                {fields.map((field) => (
                  <Link
                    key={field.id}
                    to={`/fazendas/${farmIdValue}/talhoes/${field.id}`}
                    className={styles.listItem}
                  >
                    <div>
                      <strong>{field.name}</strong>
                      <span>{field.areaHa.toFixed(2)} ha</span>
                    </div>
                    <span>Detalhes</span>
                  </Link>
                ))}
              </div>
            )}

            {!isLoading && fields.length === 0 && <p className={styles.emptyState}>Nenhum talhão cadastrado.</p>}
          </div>
        </section>
      </section>
    </main>
  );
}
