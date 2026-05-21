import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CreateMaintenanceFormData,
  MaintenancePriority,
} from '../../types';
import FormActions from './FormActions';
import { formatEnumLabel } from '../../utils/format';
import {
  descriptionField,
  priorityField,
  titleField,
} from '../../validators/maintenanceSchemas';

const schema = z
  .object({
    title: titleField,
    description: descriptionField,
    priority: priorityField,
    propertyId: z.string().trim().min(1, 'Property identifier is required'),
  })
  .strict();

type Values = z.infer<typeof schema>;

interface CreateMaintenanceFormProps {
  onSubmit: (data: CreateMaintenanceFormData) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

const errorText = (msg?: string) =>
  msg ? <p className="mt-1 text-sm text-red-600">{msg}</p> : null;

const CreateMaintenanceForm: React.FC<CreateMaintenanceFormProps> = ({
  onSubmit,
  onCancel,
  submitting,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { priority: MaintenancePriority.NORMAL },
  });

  return (
    <form
      onSubmit={handleSubmit(values => onSubmit(values))}
      className="space-y-4"
    >
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="propertyId" className={labelClass}>
            Property
          </label>
          <input
            id="propertyId"
            type="text"
            className="input"
            {...register('propertyId')}
          />
          {errorText(errors.propertyId?.message)}
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
      </div>

      <FormActions
        submitLabel="Create request"
        onCancel={onCancel}
        submitting={submitting}
      />
    </form>
  );
};

export default CreateMaintenanceForm;
