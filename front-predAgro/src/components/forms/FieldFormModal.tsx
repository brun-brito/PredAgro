import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { fieldService, type FieldPayload } from '../../services/fieldService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import type { Field } from '../../types/domain';
import { resolveErrorMessage } from '../../utils/errors';
import styles from './FormModal.module.css';

interface FieldFormValues {
  name: string;
}

const initialValues: FieldFormValues = {
  name: '',
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
    });
  }, [isOpen, field]);

  function buildPayload(): FieldPayload {
    return { name: formValues.name.trim() };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
            onChange={(event) => setFormValues({ name: event.target.value })}
            required
            minLength={3}
          />
        </label>
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
