import type { Types } from 'mongoose';
import { Session, type ISession } from '../models/session.model';

interface CreateSessionPayload {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  refreshTokenHash: string;
  refreshTokenId: string;
  expiresAt: Date;
  userAgent?: string;
  ip?: string;
}

export class SessionRepository {
  create(payload: CreateSessionPayload): Promise<ISession> {
    return Session.create(payload);
  }

  findByIdWithToken(sessionId: string, userId: string): Promise<ISession | null> {
    return Session.findOne({ _id: sessionId, user: userId }).select('+refreshTokenHash').exec();
  }

  listActiveForUser(userId: string): Promise<ISession[]> {
    return Session.find({
      user: userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    })
      .sort({ lastUsedAt: -1, createdAt: -1 })
      .exec();
  }

  revokeByIdForUser(sessionId: string, userId: string): Promise<ISession | null> {
    return Session.findOneAndUpdate(
      { _id: sessionId, user: userId, revokedAt: null },
      { revokedAt: new Date() },
      { new: true }
    ).exec();
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await Session.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() }).exec();
  }
}
