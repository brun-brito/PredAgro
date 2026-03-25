import { useEffect, useState, type FormEvent } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { ApiError } from '../services/httpClient';
import { useAuth } from '../hooks/useAuth';
import styles from './AuthPage.module.css';

interface FormValues {
  name: string;
  telefone: string;
  email: string;
  password: string;
}

const initialFormValues: FormValues = {
  name: '',
  telefone: '',
  email: '',
  password: '',
};

type FeedbackTone = 'error' | 'success';

interface FeedbackState {
  message: string;
  tone: FeedbackTone;
}

export function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, isAuthenticated } = useAuth();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

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

  function resolveErrorMessage(error: unknown, fallback: string) {
    if (error instanceof ApiError) {
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return fallback;
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
      setFeedback({ message: resolveErrorMessage(error, 'Não foi possível processar sua solicitação.'), tone: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleAuth() {
    setFeedback(null);
    setIsGoogleSubmitting(true);

    try {
      await signInWithGoogle();
      navigate('/painel', { replace: true });
    } catch (error) {
      setFeedback({
        message: resolveErrorMessage(error, 'Não foi possível entrar com Google.'),
        tone: 'error',
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    if (!formValues.email.trim()) {
      setFeedback({ message: 'Informe seu e-mail para recuperar a senha.', tone: 'error' });
      return;
    }

    setFeedback(null);
    setIsResettingPassword(true);

    try {
      const response = await authService.forgotPassword(formValues.email);
      setFeedback({ message: response.message, tone: 'success' });
    } catch (error) {
      setFeedback({
        message: resolveErrorMessage(error, 'Não foi possível enviar o e-mail de recuperação.'),
        tone: 'error',
      });
    } finally {
      setIsResettingPassword(false);
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
            <div className={styles.googleAccess}>
              <button
                type="button"
                onClick={handleGoogleAuth}
                className={styles.googleButton}
                disabled={isSubmitting || isGoogleSubmitting || isResettingPassword}
              >
                <FcGoogle />
                <span>
                  {isGoogleSubmitting
                    ? 'Conectando com Google...'
                    : isLoginMode
                      ? 'Entrar com Google'
                      : 'Cadastrar com Google'}
                </span>
              </button>
              <div className={styles.divider}>
                <span>ou continue com e-mail</span>
              </div>
            </div>

            {!isLoginMode && (
              <>
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

                <label>
                  Telefone
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={formValues.telefone}
                    onChange={(event) => updateField('telefone', event.target.value)}
                    required
                    minLength={8}
                    maxLength={11}
                  />
                </label>
              </>
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
              <div className={styles.labelRow}>
                <span>Senha</span>
                {isLoginMode && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className={styles.inlineAction}
                    disabled={isSubmitting || isResettingPassword || isGoogleSubmitting}
                  >
                    {isResettingPassword ? 'Enviando...' : 'Esqueci minha senha'}
                  </button>
                )}
              </div>
              <input
                type="password"
                value={formValues.password}
                onChange={(event) => updateField('password', event.target.value)}
                required
                minLength={6}
              />
            </label>

            {feedback && (
              <p className={`${styles.feedback} ${feedback.tone === 'success' ? styles.successFeedback : ''}`}>
                {feedback.message}
              </p>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || isResettingPassword || isGoogleSubmitting}
            >
              {isSubmitting ? 'Processando...' : isLoginMode ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
