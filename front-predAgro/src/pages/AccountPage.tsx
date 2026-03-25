import { useEffect, useState, type FormEvent } from 'react';
import { FaArrowLeft } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { LoadingState } from '../components/ui/LoadingState';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { accountService } from '../services/accountService';
import type { AccountProfile } from '../types/domain';
import { resolveErrorMessage } from '../utils/errors';
import styles from './AccountPage.module.css';

interface FormValues {
  name: string;
  email: string;
  telefone: string;
}

function resolveProviderLabel(profile: AccountProfile | null) {
  if (!profile) {
    return 'Conta PredAgro';
  }

  if (profile.authProvider === 'google.com') {
    return 'Conta Google';
  }

  if (profile.authProvider === 'password' || profile.emailEditable) {
    return 'Conta com senha';
  }

  return 'Conta vinculada';
}

export function AccountPage() {
  const { token, user, updateAuthenticatedUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const [formValues, setFormValues] = useState<FormValues>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    telefone: user?.telefone ?? '',
  });
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!token) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const response = await accountService.getProfile(token);

        if (!isMounted) {
          return;
        }

        setProfile(response);
        setFormValues({
          name: response.user.name,
          email: response.user.email,
          telefone: response.user.telefone ?? '',
        });
        updateAuthenticatedUser(response.user);
      } catch (error) {
        if (isMounted) {
          showError(resolveErrorMessage(error, 'Não foi possível carregar os dados da conta.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [token, updateAuthenticatedUser, showError]);

  function updateField(field: keyof FormValues, value: string) {
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

    setIsSubmitting(true);

    try {
      const response = await accountService.updateProfile(token, formValues);

      setProfile(response);
      setFormValues({
        name: response.user.name,
        email: response.user.email,
        telefone: response.user.telefone ?? '',
      });
      updateAuthenticatedUser(response.user);
      showSuccess('Dados atualizados com sucesso.');
    } catch (error) {
      showError(resolveErrorMessage(error, 'Não foi possível atualizar os dados da conta.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Minha conta</p>
            <h1>Visualize e ajuste seus dados de cadastro</h1>
            <p className={styles.subtitle}>
              Mantenha seu nome, e-mail e telefone atualizados para usar a plataforma sem ruído.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link to="/painel" className={styles.outlineButton}>
              <FaArrowLeft />
              Voltar ao painel
            </Link>
          </div>
        </header>
        {isLoading ? (
          <section className={styles.loadingBlock}>
            <LoadingState label="Carregando dados da conta..." />
          </section>
        ) : (
          <section className={styles.grid}>
            <article className={styles.card}>
              <header className={styles.cardHeader}>
                <div>
                  <p className={styles.cardEyebrow}>Cadastro</p>
                  <h2>Dados do usuário</h2>
                </div>
                <span className={styles.providerBadge}>{resolveProviderLabel(profile)}</span>
              </header>

              <form className={styles.form} onSubmit={handleSubmit}>
                <label>
                  Nome completo
                  <input
                    type="text"
                    value={formValues.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    minLength={3}
                    required
                    disabled={isSubmitting}
                    autoComplete="name"
                  />
                </label>

                <label>
                  E-mail
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    required
                    disabled={isSubmitting || profile?.emailEditable === false}
                    autoComplete="email"
                  />
                </label>

                <p className={styles.helperText}>
                  {profile?.emailEditable === false
                    ? 'O e-mail desta conta é gerenciado pela autenticação Google vinculada.'
                    : 'Esse e-mail será usado como seu acesso principal na plataforma.'}
                </p>

                <label>
                  Telefone
                  <input
                    type="tel"
                    inputMode="tel"
                    value={formValues.telefone}
                    onChange={(event) => updateField('telefone', event.target.value)}
                    minLength={8}
                    maxLength={15}
                    required
                    disabled={isSubmitting}
                    autoComplete="tel"
                  />
                </label>

                <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </form>
            </article>

            <aside className={styles.card}>
              <header className={styles.cardHeader}>
                <div>
                  <p className={styles.cardEyebrow}>Orientações</p>
                  <h2>Como esse cadastro funciona</h2>
                </div>
              </header>

              <div className={styles.infoList}>
                <p>
                  <strong>Nome:</strong> aparece no painel e identifica sua conta dentro da plataforma.
                </p>
                <p>
                  <strong>Telefone:</strong> fica salvo junto ao seu cadastro para contato e conferência dos dados.
                </p>
                <p>
                  <strong>E-mail:</strong> {profile?.emailEditable === false
                    ? 'para contas Google, a alteração deve ser feita na própria conta Google.'
                    : 'pode ser alterado aqui e passa a ser seu novo acesso na plataforma.'}
                </p>
              </div>
            </aside>
          </section>
        )}
      </section>
    </main>
  );
}
