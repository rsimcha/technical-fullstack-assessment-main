import React from 'react';
import Modal from './Modal';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}) => (
  <Modal title={title} onClose={onCancel}>
    <div className="space-y-4">
      <p className="text-sm text-gray-700">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="btn-outline btn-md"
          onClick={onCancel}
          disabled={busy}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={
            destructive
              ? 'btn btn-md bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
              : 'btn-primary btn-md'
          }
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;
