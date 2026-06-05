import bcrypt from 'bcryptjs';
import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import { USER_ROLE_VALUES, type UserRole } from '../../../constants/roles';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  teamLeadId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = Model<IUser>;

const userSchema = new Schema<IUser, UserModel>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    role: {
      type: String,
      enum: USER_ROLE_VALUES,
      default: 'employee',
      required: true
    },
    teamLeadId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const output = ret as Record<string, unknown>;
        delete output['password'];
        delete output['__v'];
        output['id'] = String(output['_id']);
        delete output['_id'];
        return ret;
      }
    }
  }
);

userSchema.index({ role: 1 });
userSchema.index({ teamLeadId: 1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser, UserModel>('User', userSchema);
