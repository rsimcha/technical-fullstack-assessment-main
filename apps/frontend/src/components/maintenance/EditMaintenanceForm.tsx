import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Manager,
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceStatus,
  UpdateMaintenanceFormData,
} from '../../types';
import AssigneePicker from './AssigneePicker';
import FormActions from './FormActions';
import { formatEnumLabel } from '../../utils/format';
import {
  descriptionField,
  priorityField,
  statusField,
  titleField,
} from '../../validators/maintenanceSchemas';

const ALLOWED_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  [MaintenanceStatus.OPEN]: [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.IN_PROGRESS]: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.COMPLETED]: [],
  [MaintenanceStatus.CANCELLED]: [],
};

const schema = z
  .object({
    title: titleField,
    description: descriptionField,
    priority: priorityField,
    status: statusField,
    assignedTo: z.string(),
  })
  .strict();

type Values = z.infer<typeof schema>;

interface EditMaintenanceFormProps {
  request: MaintenanceRequest;
  managers: Manager[];
  onSubmit: (patch: UpdateMaintenanceFormData) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

const errorText = (msg?: string) =>
  msg ? <p className="mt-1 text-sm text-red-600">{msg}</p> : null;

const EditMaintenanceForm: React.FC<EditMaintenanceFormProps> = ({
  request,
  managers,
  onSubmit,
  onCancel,
  submitting,
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: request.title,
      description: request.description,
      priority: request.priority,
      status: request.status,
      assignedTo: request.assignedTo?._id ?? '',
    },
  });

  const submit = (values: Values) => {
    const patch: UpdateMaintenanceFormData = {
      title: values.title,
      description: values.description,
      priority: values.priority,
      status: values.status,
      assignedTo: values.assignedTo === '' ? null : values.assignedTo,
    };
    return onSubmit(patch);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div>
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input id="title" type="text" className="input" {...register('title')} />
        {errorText(errors.title?.message)}
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          className="input h-auto"
          {...register('description')}
        />
        {errorText(errors.description?.message)}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select
            id="status"
            className="input"
            disabled={ALLOWED_TRANSITIONS[request.status].length === 0}
            title={
              ALLOWED_TRANSITIONS[request.status].length === 0
                ? `Status is locked — ${formatEnumLabel(request.status)} requests cannot be transitioned`
                : undefined
            }
            {...register('status')}
          >
            {[request.status, ...ALLOWED_TRANSITIONS[request.status]].map(s => (
              <option key={s} value={s}>
                {formatEnumLabel(s)}
              </option>
            ))}
          </select>
          {errorText(errors.status?.message)}
        </div>

        <div>
          <label htmlFor="priority" className={labelClass}>
            Priority
          </label>
          <select id="priority" className="input" {...register('priority')}>
            {Object.values(MaintenancePriority).map(p => (
              <option key={p} value={p}>
                {formatEnumLabel(p)}
              </option>
            ))}
          </select>
          {errorText(errors.priority?.message)}
        </div>

        <div>
          <label htmlFor="assignedTo" className={labelClass}>
            Assignee
          </label>
          <Controller
            name="assignedTo"
            control={control}
            render={({ field }) => (
              <AssigneePicker
                id="assignedTo"
                managers={managers}
                value={field.value}
                onChange={field.onChange}
                placeholder="Unassigned"
              />
            )}
          />
          {errorText(errors.assignedTo?.message)}
        </div>
      </div>

      <FormActions
        submitLabel="Save changes"
        onCancel={onCancel}
        submitting={submitting}
      />
    </form>
  );
};

export default EditMaintenanceForm;
