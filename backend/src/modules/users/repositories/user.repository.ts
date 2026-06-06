import type { Types } from 'mongoose';
import type { UserRole } from '../../../constants/roles';
import type { CreateUserDto } from '../dtos/user.dto';
import { User, type IUser } from '../models/user.model';

type CreateUserRecord = Omit<CreateUserDto, 'teamLeadId'> & {
  teamLeadId?: Types.ObjectId | null;
};

export class UserRepository {
  findAll(): Promise<IUser[]> {
    return User.find().sort({ role: 1, username: 1 }).exec();
  }

  findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  findById(userId: string | Types.ObjectId): Promise<IUser | null> {
    return User.findById(userId).exec();
  }

  findByRole(role: UserRole): Promise<IUser[]> {
    return User.find({ role }).sort({ username: 1 }).exec();
  }

  findBySearchTerm(searchTerm: string): Promise<IUser[]> {
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedTerm, 'i');

    return User.find({
      $or: [{ username: searchRegex }, { email: searchRegex }]
    }).exec();
  }

  findTeamMembers(teamLeadId: string | Types.ObjectId): Promise<IUser[]> {
    return User.find({ teamLeadId }).sort({ username: 1 }).exec();
  }

  findSelfAndTeam(userId: string | Types.ObjectId): Promise<IUser[]> {
    return User.find({
      $or: [{ _id: userId }, { teamLeadId: userId }]
    })
      .sort({ role: 1, username: 1 })
      .exec();
  }

  create(payload: CreateUserRecord): Promise<IUser> {
    return User.create(payload);
  }

  async existsById(userId: string | Types.ObjectId): Promise<boolean> {
    return Boolean(await User.exists({ _id: userId }));
  }

  async existsTeamMember(userId: string | Types.ObjectId, teamLeadId: string | Types.ObjectId): Promise<boolean> {
    return Boolean(
      await User.exists({
        _id: userId,
        teamLeadId
      })
    );
  }
}
