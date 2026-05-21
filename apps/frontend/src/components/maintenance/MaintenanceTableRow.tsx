import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import {
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceStatus,
} from '../../types';
import { formatDate, formatEnumLabel } from '../../utils/format';

interface MaintenanceTableRowProps {
  request: MaintenanceRequest;
  canManage: boolean;
  onEdit: (request: MaintenanceRequest) => void;
  onDelete: (request: MaintenanceRequest) => void;
}

const statusClasses: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.OPEN]: 'bg-blue-100 text-blue-800',
  [MaintenanceStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
  [MaintenanceStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [MaintenanceStatus.CANCELLED]: 'bg-gray-100 text-gray-700',
};

const priorityClasses: Record<MaintenancePriority, string> = {
  [MaintenancePriority.LOW]: 'bg-gray-100 text-gray-700',
  [MaintenancePriority.NORMAL]: 'bg-blue-50 text-blue-700',
  [MaintenancePriority.HIGH]: 'bg-orange-100 text-orange-800',
  [MaintenancePriority.URGENT]: 'bg-red-100 text-red-800',
};

const td = 'px-4 py-3 text-sm text-gray-700';
const badge =
  'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium';

const MaintenanceTableRow: React.FC<MaintenanceTableRowProps> = ({
  request,
  canManage,
  onEdit,
  onDelete,
}) => (
  <tr className="hover:bg-gray-50">
    <td className={td}>
      <div className="font-medium text-gray-900">{request.title}</div>
      <div className="text-xs text-gray-500 line-clamp-1">
        {request.description}
      </div>
    </td>
    <td className={td}>
      <span className={`${badge} ${statusClasses[request.status]}`}>
        {formatEnumLabel(request.status)}
      </span>
    </td>
    <td className={td}>
      <span className={`${badge} ${priorityClasses[request.priority]}`}>
        {formatEnumLabel(request.priority)}
      </span>
    </td>
    <td className={td}>{request.propertyId}</td>
    <td className={td}>
      {request.assignedTo ? (
        `${request.assignedTo.firstName} ${request.assignedTo.lastName}`
      ) : (
        <span className="text-gray-400">Unassigned</span>
      )}
    </td>
    <td className={td}>{formatDate(request.createdAt)}</td>
    {canManage && (
      <td className={`${td} text-right`}>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => onEdit(request)}
            aria-label={`Edit ${request.title}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
            onClick={() => onDelete(request)}
            aria-label={`Delete ${request.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    )}
  </tr>
);

export default MaintenanceTableRow;
