import React from 'react';
import {
  Manager,
  MaintenanceListFilters,
  MaintenancePriority,
  MaintenanceStatus,
} from '../../types';
import AssigneePicker from './AssigneePicker';
import { formatEnumLabel } from '../../utils/format';

interface MaintenanceFiltersProps {
  filters: MaintenanceListFilters;
  managers: Manager[];
  onChange: (patch: Partial<MaintenanceListFilters>) => void;
  canFilterByAssignee: boolean;
}

const MaintenanceFilters: React.FC<MaintenanceFiltersProps> = ({
  filters,
  managers,
  onChange,
  canFilterByAssignee,
}) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
    <div>
      <label
        htmlFor="filter-status"
        className="block text-xs font-medium text-gray-700 mb-1"
      >
        Status
      </label>
      <select
        id="filter-status"
        className="input"
        value={filters.status ?? ''}
        onChange={e =>
          onChange({
            status: (e.target.value as MaintenanceStatus) || undefined,
          })
        }
      >
        <option value="">All statuses</option>
        {Object.values(MaintenanceStatus).map(s => (
          <option key={s} value={s}>
            {formatEnumLabel(s)}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label
        htmlFor="filter-priority"
        className="block text-xs font-medium text-gray-700 mb-1"
      >
        Priority
      </label>
      <select
        id="filter-priority"
        className="input"
        value={filters.priority ?? ''}
        onChange={e =>
          onChange({
            priority: (e.target.value as MaintenancePriority) || undefined,
          })
        }
      >
        <option value="">All priorities</option>
        {Object.values(MaintenancePriority).map(p => (
          <option key={p} value={p}>
            {formatEnumLabel(p)}
          </option>
        ))}
      </select>
    </div>

    {canFilterByAssignee && (
      <div>
        <label
          htmlFor="filter-assignee"
          className="block text-xs font-medium text-gray-700 mb-1"
        >
          Assignee
        </label>
        <AssigneePicker
          id="filter-assignee"
          managers={managers}
          value={filters.assignedTo ?? ''}
          placeholder="All assignees"
          onChange={v => onChange({ assignedTo: v || undefined })}
        />
      </div>
    )}
  </div>
);

export default MaintenanceFilters;
