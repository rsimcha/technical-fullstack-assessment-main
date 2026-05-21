import React from 'react';

interface MaintenanceEmptyStateProps {
  hasFilters: boolean;
  canCreate: boolean;
  onCreate: () => void;
}

const MaintenanceEmptyState: React.FC<MaintenanceEmptyStateProps> = ({
  hasFilters,
  canCreate,
  onCreate,
}) => (
  <div className="card p-6 text-center">
    <p className="text-sm text-gray-600">
      {hasFilters
        ? 'No requests match your filters.'
        : 'No maintenance requests yet.'}
    </p>
    {!hasFilters && canCreate && (
      <button
        type="button"
        className="btn-primary btn-md mt-3"
        onClick={onCreate}
      >
        Create your first request
      </button>
    )}
  </div>
);

export default MaintenanceEmptyState;
