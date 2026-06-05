import { Schema, model, type Document, type Types } from 'mongoose';

export interface ISession extends Document {
  user: Types.ObjectId;
  refreshTokenHash: string;
  refreshTokenId: string;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
  lastUsedAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    refreshTokenHash: {
      type: String,
      required: true,
      select: false
    },
    refreshTokenId: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      maxlength: 500
    },
    ip: {
      type: String,
      maxlength: 80
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    },
    revokedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const output = ret as Record<string, unknown>;
        delete output['refreshTokenHash'];
        delete output['__v'];
        output['id'] = String(output['_id']);
        delete output['_id'];
        return ret;
      }
    }
  }
);

sessionSchema.index({ user: 1, revokedAt: 1, expiresAt: 1 });
sessionSchema.index({ refreshTokenId: 1 });

export const Session = model<ISession>('Session', sessionSchema);
