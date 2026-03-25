import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { farmService } from '../../services/farmService';
import { cepService } from '../../services/cepService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import type { Farm } from '../../types/domain';
import { resolveErrorMessage } from '../../utils/errors';
import styles from './FormModal.module.css';

interface FarmFormValues {
  name: string;
  cep: string;
  city: string;
  state: string;
}

const initialValues: FarmFormValues = {
  name: '',
  cep: '',
  city: '',
  state: '',
};

interface FarmFormModalProps {
  isOpen: boolean;
  farm?: Farm | null;
  onClose: () => void;
  onSaved?: (farm: Farm, mode: 'create' | 'update') => void;
}

export function FarmFormModal({ isOpen, farm, onClose, onSaved }: FarmFormModalProps) {
  const { token } = useAuth();
  const { showError, showSuccess } = useToast();
  const [formValues, setFormValues] = useState<FarmFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [lastCepLookup, setLastCepLookup] = useState('');

  const isEditing = Boolean(farm);
  const canSubmit = Boolean(token);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormValues({
      name: farm?.name ?? '',
      cep: '',
      city: farm?.city ?? '',
      state: farm?.state ?? '',
    });
    setLastCepLookup('');
    setIsCepLoading(false);
  }, [isOpen, farm]);

  function updateField(field: keyof FarmFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleCepChange(value: string) {
    const normalized = cepService.normalize(value);
    setFormValues((current) => ({
      ...current,
      cep: normalized,
    }));
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const cep = formValues.cep;
    if (cep.length !== 8 || cep === lastCepLookup) {
      setIsCepLoading(false);
      return;
    }

    let isActive = true;
    const timer = setTimeout(async () => {
      setIsCepLoading(true);

      try {
        const result = await cepService.lookup(cep);
        if (!isActive) {
          return;
        }
        setFormValues((current) => ({
          ...current,
          city: result.city,
          state: result.state,
        }));
        setLastCepLookup(cep);
      } catch (error) {
        if (!isActive) {
          return;
        }
        showError(error instanceof Error ? error.message : 'Não foi possível localizar o CEP.');
      } finally {
        if (isActive) {
          setIsCepLoading(false);
        }
      }
    }, 450);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [formValues.cep, isOpen, lastCepLookup, showError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && farm) {
        const response = await farmService.update(token, farm.id, {
          name: formValues.name,
          city: formValues.city || undefined,
          state: formValues.state || undefined,
        });
        onSaved?.(response.farm, 'update');
      } else {
        const response = await farmService.create(token, {
          name: formValues.name,
          city: formValues.city || undefined,
          state: formValues.state || undefined,
        });
        onSaved?.(response.farm, 'create');
      }
      showSuccess(isEditing ? 'Fazenda atualizada com sucesso.' : 'Fazenda cadastrada com sucesso.');
      onClose();
    } catch (error) {
      showError(resolveErrorMessage(error, 'Não foi possível salvar a fazenda.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? 'Editar fazenda' : 'Cadastrar fazenda'}
      onClose={onClose}
      size="md"
    >
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
        <label>
          CEP para localizar cidade
          <input
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="Somente números"
            value={formValues.cep}
            onChange={(event) => handleCepChange(event.target.value)}
            maxLength={8}
          />
        </label>
        {isCepLoading && <p className={styles.helperText}>Buscando CEP...</p>}
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
        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.outlineButton}>
            Cancelar
          </button>
          <button type="submit" className={styles.primaryButton} disabled={isSubmitting || !canSubmit}>
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar fazenda'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
