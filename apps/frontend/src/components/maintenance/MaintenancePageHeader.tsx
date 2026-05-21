import React from 'react';
import { Plus } from 'lucide-react';

interface MaintenancePageHeaderProps {
  canManage: boolean;
  canCreate: boolean;
  onCreate: () => void;
}

const MaintenancePageHeader: React.FC<MaintenancePageHeaderProps> = ({
  canManage,
  canCreate,
  onCreate,
}) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Maintenance Requests
      </h1>
      <p className="text-sm text-gray-600">
        {canManage
          ? 'View, assign, and manage maintenance requests.'
          : 'View and submit maintenance requests.'}
      </p>
    </div>
    {canCreate && (
      <button type="button" className="btn-primary btn-md" onClick={onCreate}>
        <Plus className="h-4 w-4 mr-2" />
        New request
      </button>
    )}
  </div>
);

export default MaintenancePageHeader;
