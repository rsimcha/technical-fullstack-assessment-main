import React from 'react';
import { Manager } from '../../types';

interface AssigneePickerProps {
  managers: Manager[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
}

const AssigneePicker: React.FC<AssigneePickerProps> = ({
  managers,
  value,
  onChange,
  placeholder = 'Unassigned',
  id,
  disabled,
}) => (
  <select
    id={id}
    className="input"
    value={value}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
  >
    <option value="">{placeholder}</option>
    {managers.map(m => (
      <option key={m._id} value={m._id}>
        {m.firstName} {m.lastName}
      </option>
    ))}
  </select>
);

export default AssigneePicker;
