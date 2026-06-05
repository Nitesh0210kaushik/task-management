import { User, type IUser } from '../../users/models/user.model';
import type { CreateAuthUserDto } from '../dtos/auth.dto';

export class AuthRepository {
  findUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId).exec();
  }

  findUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  findUserByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase().trim() }).select('+password').exec();
  }

  createUser(payload: CreateAuthUserDto): Promise<IUser> {
    return User.create(payload);
  }
}
