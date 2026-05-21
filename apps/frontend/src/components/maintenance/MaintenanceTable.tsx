import React from 'react';
import { MaintenanceRequest } from '../../types';
import MaintenanceTableRow from './MaintenanceTableRow';

interface MaintenanceTableProps {
  items: MaintenanceRequest[];
  canManage: boolean;
  onEdit: (request: MaintenanceRequest) => void;
  onDelete: (request: MaintenanceRequest) => void;
}

const th =
  'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500';

const MaintenanceTable: React.FC<MaintenanceTableProps> = ({
  items,
  canManage,
  onEdit,
  onDelete,
}) => (
  <div className="card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className={th}>Title</th>
            <th className={th}>Status</th>
            <th className={th}>Priority</th>
            <th className={th}>Property</th>
            <th className={th}>Assignee</th>
            <th className={th}>Created</th>
            {canManage && <th className={`${th} text-right`}>Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {items.map(request => (
            <MaintenanceTableRow
              key={request._id}
              request={request}
              canManage={canManage}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default MaintenanceTable;
