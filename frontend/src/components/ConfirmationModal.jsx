import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

const ConfirmationModal = ({
  open,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  loading = false,
  danger = false,
  children,
}) => (
  <Modal
    open={open}
    onClose={loading ? () => {} : onClose}
    title={title}
    size="sm"
    footer={
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-outline" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={danger ? 'btn-danger' : 'btn-primary'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    }
  >
    <div className="flex gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${danger ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600'}`}>
        <AlertTriangle size={22} />
      </div>
      <p className="pt-1 text-sm leading-6 text-ink-600">{message}</p>
    </div>
    {children}
  </Modal>
);

export default ConfirmationModal;
