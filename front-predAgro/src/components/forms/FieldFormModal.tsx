import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { fieldService, type FieldPayload } from '../../services/fieldService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import type { DrainageLevel, Field, SoilTexture } from '../../types/domain';
import { resolveErrorMessage } from '../../utils/errors';
import styles from './FormModal.module.css';

interface FieldFormValues {
  name: string;
  soilTexture: SoilTexture | '';
  drainage: DrainageLevel | '';
  irrigation: 'sim' | 'nao' | '';
}

const initialValues: FieldFormValues = {
  name: '',
  soilTexture: '',
  drainage: '',
  irrigation: '',
};

interface FieldFormModalProps {
  isOpen: boolean;
  farmId: string;
  field?: Field | null;
  onClose: () => void;
  onSaved?: (field: Field, mode: 'create' | 'update') => void;
}

export function FieldFormModal({ isOpen, farmId, field, onClose, onSaved }: FieldFormModalProps) {
  const { token } = useAuth();
  const { showError, showSuccess } = useToast();
  const [formValues, setFormValues] = useState<FieldFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(field);
  const canSubmit = Boolean(token && farmId);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormValues({
      name: field?.name ?? '',
      soilTexture: field?.soilTexture ?? '',
      drainage: field?.drainage ?? '',
      irrigation:
        field?.irrigation === undefined ? '' : field.irrigation ? 'sim' : 'nao',
    });
  }, [isOpen, field]);

  function updateField(fieldKey: keyof FieldFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [fieldKey]: value,
    }));
  }

  function buildPayload(): FieldPayload {
    const payload: FieldPayload = {
      name: formValues.name.trim(),
    };

    if (formValues.soilTexture) {
      payload.soilTexture = formValues.soilTexture;
    }

    if (formValues.drainage) {
      payload.drainage = formValues.drainage;
    }

    if (formValues.irrigation === 'sim') {
      payload.irrigation = true;
    } else if (formValues.irrigation === 'nao') {
      payload.irrigation = false;
    }

    return payload;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !farmId) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = buildPayload();

      if (isEditing && field) {
        const response = await fieldService.update(token, farmId, field.id, payload);
        onSaved?.(response.field, 'update');
      } else {
        const response = await fieldService.create(token, farmId, payload);
        onSaved?.(response.field, 'create');
      }
      showSuccess(isEditing ? 'Talhão atualizado com sucesso.' : 'Talhão cadastrado com sucesso.');
      onClose();
    } catch (error) {
      showError(resolveErrorMessage(error, 'Não foi possível salvar o talhão.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? 'Editar talhão' : 'Cadastrar talhão'}
      onClose={onClose}
      size="md"
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          Nome do talhão
          <input
            type="text"
            value={formValues.name}
            onChange={(event) => updateField('name', event.target.value)}
            required
            minLength={3}
          />
        </label>

        <div className={styles.grid}>
          <label>
            Textura do solo
            <select
              value={formValues.soilTexture}
              onChange={(event) => updateField('soilTexture', event.target.value)}
            >
              <option value="">Não informado</option>
              <option value="arenoso">Arenoso</option>
              <option value="medio">Médio</option>
              <option value="argiloso">Argiloso</option>
            </select>
          </label>
          <label>
            Drenagem
            <select value={formValues.drainage} onChange={(event) => updateField('drainage', event.target.value)}>
              <option value="">Não informado</option>
              <option value="bom">Boa</option>
              <option value="medio">Média</option>
              <option value="ruim">Ruim</option>
            </select>
          </label>
          <label>
            Irrigação
            <select
              value={formValues.irrigation}
              onChange={(event) => updateField('irrigation', event.target.value)}
            >
              <option value="">Não informado</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </label>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.outlineButton}>
            Cancelar
          </button>
          <button type="submit" className={styles.primaryButton} disabled={isSubmitting || !canSubmit}>
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar talhão'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
