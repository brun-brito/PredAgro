import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../services/httpClient';
import { useAuth } from '../hooks/useAuth';
import styles from './AuthPage.module.css';

interface FormValues {
  name: string;
  email: string;
  password: string;
}

const initialFormValues: FormValues = {
  name: '',
  email: '',
  password: '',
};

export function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated } = useAuth();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/painel', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  function updateField(field: keyof FormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        await signIn(formValues.email, formValues.password);
      } else {
        await signUp(formValues);
      }

      navigate('/painel', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFeedback(error.message);
      } else {
        setFeedback('Não foi possível processar sua solicitação.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.authCard}>
        <div className={styles.contextPanel}>
          <p className={styles.eyebrow}>PredAgro</p>
          <h1>{isLoginMode ? 'Acesse sua conta' : 'Crie sua conta'}</h1>
          <p>
            Ambiente seguro para acompanhar clima, previsões e alertas agrícolas da sua propriedade.
          </p>
          <Link to="/" className={styles.backLink}>
            Voltar para página inicial
          </Link>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.switcher}>
            <button
              type="button"
              className={isLoginMode ? styles.activeMode : ''}
              onClick={() => {
                setIsLoginMode(true);
                setFeedback(null);
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              className={!isLoginMode ? styles.activeMode : ''}
              onClick={() => {
                setIsLoginMode(false);
                setFeedback(null);
              }}
            >
              Cadastrar
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {!isLoginMode && (
              <label>
                Nome completo
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  required
                  minLength={3}
                />
              </label>
            )}

            <label>
              E-mail
              <input
                type="email"
                value={formValues.email}
                onChange={(event) => updateField('email', event.target.value)}
                required
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                value={formValues.password}
                onChange={(event) => updateField('password', event.target.value)}
                required
                minLength={6}
              />
            </label>

            {feedback && <p className={styles.feedback}>{feedback}</p>}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processando...' : isLoginMode ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
