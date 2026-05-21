import React from 'react';

interface FormActionsProps {
  submitLabel: string;
  onCancel: () => void;
  submitting: boolean;
}

const FormActions: React.FC<FormActionsProps> = ({
  submitLabel,
  onCancel,
  submitting,
}) => (
  <div className="flex justify-end gap-3 pt-2">
    <button
      type="button"
      className="btn-outline btn-md"
      onClick={onCancel}
      disabled={submitting}
    >
      Cancel
    </button>
    <button type="submit" className="btn-primary btn-md" disabled={submitting}>
      {submitting ? 'Saving…' : submitLabel}
    </button>
  </div>
);

export default FormActions;
