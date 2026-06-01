import { useEffect, useState, type FormEvent } from 'react';
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"/>
    </svg>
  );
}
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { resolveErrorMessage } from '../utils/errors';
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

export function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, isAuthenticated } = useAuth();
  const { showError, showSuccess } = useToast();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

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
    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        await signIn(formValues.email, formValues.password);
      } else {
        await signUp(formValues);
      }

      navigate('/painel', { replace: true });
    } catch (error) {
      showError(resolveErrorMessage(error, 'Não foi possível processar sua solicitação.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleAuth() {
    setIsGoogleSubmitting(true);

    try {
      await signInWithGoogle();
      navigate('/painel', { replace: true });
    } catch (error) {
      showError(resolveErrorMessage(error, 'Não foi possível entrar com Google.'));
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    if (!formValues.email.trim()) {
      showError('Informe seu e-mail para recuperar a senha.');
      return;
    }

    setIsResettingPassword(true);

    try {
      const response = await authService.forgotPassword(formValues.email);
      showSuccess(response.message);
    } catch (error) {
      showError(resolveErrorMessage(error, 'Não foi possível enviar o e-mail de recuperação.'));
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
            Ambiente seguro para acompanhar clima, planejamento e alertas da operação atual em cada talhão.
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
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              className={!isLoginMode ? styles.activeMode : ''}
              onClick={() => {
                setIsLoginMode(false);
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
                <GoogleIcon />
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
