import {
  prop,
  getModelForClass,
  pre,
  DocumentType,
} from '@typegoose/typegoose';
import bcrypt from 'bcryptjs';

@pre<User>('save', async function (next) {
  // Only hash if password is new or modified and not already hashed
  if (!this.isModified('password') || this.password.startsWith('$2'))
    {return next();}

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
})
export class User {
  @prop({ required: true, unique: true, lowercase: true, trim: true })
  public email!: string;

  @prop({ required: true, minlength: 6 })
  public password!: string;

  @prop({ required: true, trim: true })
  public firstName!: string;

  @prop({ required: true, trim: true })
  public lastName!: string;

  @prop({
    required: true,
    enum: ['admin', 'manager', 'tenant'],
    default: 'tenant',
  })
  public role!: 'admin' | 'manager' | 'tenant';

  @prop({ default: false })
  public isEmailVerified!: boolean;

  @prop()
  public resetPasswordToken?: string;

  @prop()
  public resetPasswordExpires?: Date;

  @prop({ default: Date.now })
  public createdAt!: Date;

  @prop({ default: Date.now })
  public updatedAt!: Date;

  // Instance method to compare password
  public async comparePassword(
    this: DocumentType<User>,
    candidatePassword: string
  ): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Virtual for full name
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Remove password from JSON output
  public toJSON() {
    const obj = (this as any).toObject();
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    return obj;
  }
}

export type UserDocument = DocumentType<User>;
export const UserModel = getModelForClass(User);
