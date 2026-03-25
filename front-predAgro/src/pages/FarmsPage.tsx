import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa6';
import { LoadingState } from '../components/ui/LoadingState';
import { farmService } from '../services/farmService';
import { FarmFormModal } from '../components/forms/FarmFormModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import type { Farm } from '../types/domain';
import { resolveErrorMessage } from '../utils/errors';
import styles from './FarmsPage.module.css';

export function FarmsPage() {
  const { token } = useAuth();
  const { showError, showSuccess } = useToast();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [deletingFarmId, setDeletingFarmId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFarms() {
      if (!token) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      const cached = farmService.getCachedList(token);
      if (cached && isMounted) {
        setFarms(cached.farms);
        setIsLoading(false);
      }

      if (cached) {
        return;
      }

      setIsLoading(true);
      setFarms([]);

      try {
        const response = await farmService.list(token);
        if (isMounted) {
          setFarms(response.farms);
        }
      } catch (error) {
        if (isMounted) {
          showError(resolveErrorMessage(error, 'Não foi possível carregar as fazendas cadastradas.'));
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
  }, [token, showError]);

  function openCreateModal() {
    setEditingFarm(null);
    setIsModalOpen(true);
  }

  function openEditModal(farm: Farm) {
    setEditingFarm(farm);
    setIsModalOpen(true);
  }

  function handleModalClose() {
    setIsModalOpen(false);
    setEditingFarm(null);
  }

  function handleFarmSaved(farm: Farm, mode: 'create' | 'update') {
    setFarms((current) => {
      if (mode === 'create') {
        return [farm, ...current];
      }
      return current.map((item) => (item.id === farm.id ? farm : item));
    });
  }

  async function handleDeleteFarm(farm: Farm) {
    if (!token) {
      return;
    }

    const shouldDelete = window.confirm(
      `Deseja apagar a fazenda ${farm.name}? Isso também removerá seus talhões, planejamentos, análises e previsões salvas.`
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingFarmId(farm.id);

    try {
      await farmService.remove(token, farm.id);
      setFarms((current) => current.filter((item) => item.id !== farm.id));
      showSuccess('Fazenda apagada com sucesso.');
    } catch (error) {
      showError(resolveErrorMessage(error, 'Não foi possível apagar a fazenda.'));
    } finally {
      setDeletingFarmId(null);
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
          <div className={styles.headerActions}>
            <button type="button" onClick={openCreateModal} className={styles.primaryButton}>
              + Cadastrar fazenda
            </button>
            <Link to="/painel" className={styles.outlineButton}>
              <FaArrowLeft />
              Voltar ao painel
            </Link>
          </div>
        </header>
        <section className={styles.card}>
          <h2>Fazendas cadastradas</h2>
          {isLoading ? (
            <div className={styles.loadingBlock}>
              <LoadingState label="Carregando fazendas..." />
            </div>
          ) : (
            <div className={styles.list}>
                {farms.map((farm) => (
                  <div key={farm.id} className={styles.listItem}>
                    <div>
                      <strong>{farm.name}</strong>
                      <span>
                        {farm.city ?? 'Cidade não informada'} {farm.state ? `- ${farm.state}` : ''}
                      </span>
                    </div>
                    <div className={styles.listActions}>
                      <Link to={`/fazendas/${farm.id}`} className={styles.outlineButton}>
                        Ver talhões
                      </Link>
                      <button type="button" onClick={() => openEditModal(farm)} className={styles.outlineButton}>
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFarm(farm)}
                        className={styles.dangerButton}
                        disabled={deletingFarmId === farm.id}
                      >
                        {deletingFarmId === farm.id ? 'Apagando...' : 'Apagar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          {!isLoading && farms.length === 0 && <p className={styles.emptyState}>Nenhuma fazenda cadastrada.</p>}
        </section>
      </section>
      <FarmFormModal
        isOpen={isModalOpen}
        farm={editingFarm}
        onClose={handleModalClose}
        onSaved={handleFarmSaved}
      />
    </main>
  );
}
