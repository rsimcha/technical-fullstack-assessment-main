import {
  prop,
  getModelForClass,
  modelOptions,
  Ref,
  DocumentType,
  index,
} from '@typegoose/typegoose';
import { User } from './User';

export enum MaintenanceStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum MaintenancePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@index({ createdBy: 1 })
@index({ status: 1, priority: 1 })
@modelOptions({ schemaOptions: { timestamps: true } })
export class MaintenanceRequest {
  @prop({ required: true, trim: true, minlength: 3, maxlength: 120 })
  public title!: string;

  @prop({ required: true, trim: true, minlength: 1, maxlength: 2000 })
  public description!: string;

  @prop({
    required: true,
    enum: MaintenanceStatus,
    default: MaintenanceStatus.OPEN,
  })
  public status!: MaintenanceStatus;

  @prop({
    required: true,
    enum: MaintenancePriority,
    default: MaintenancePriority.NORMAL,
  })
  public priority!: MaintenancePriority;

  @prop({ required: true, trim: true })
  public propertyId!: string;

  @prop({ ref: () => User, required: true })
  public createdBy!: Ref<User>;

  @prop({ ref: () => User })
  public assignedTo?: Ref<User>;

  @prop()
  public completedAt?: Date;

  @prop()
  public createdAt!: Date;

  @prop()
  public updatedAt!: Date;
}

export type MaintenanceRequestDocument = DocumentType<MaintenanceRequest>;
export const MaintenanceRequestModel = getModelForClass(MaintenanceRequest);
