import { type FilterQuery, type Types } from 'mongoose';
import { USER_ROLES } from '../../../constants/roles';
import type { AuthUser } from '../../auth/types/auth.types';
import type { ITask } from '../../tasks/models/task.model';
import type { IUser } from '../models/user.model';
import { UserRepository } from '../repositories/user.repository';

const objectIdEquals = (left: Types.ObjectId | string, right: Types.ObjectId | string): boolean => {
  return left.toString() === right.toString();
};

export class PermissionService {
  private readonly userRepository = new UserRepository();

  async getVisibleUserIds(user: AuthUser): Promise<Types.ObjectId[]> {
    if (user.role === USER_ROLES.MANAGER) {
      const users = await this.userRepository.findAll();
      return users.map((item) => item._id);
    }

    if (user.role === USER_ROLES.TEAM_LEAD) {
      const teamMembers = await this.userRepository.findTeamMembers(user._id);
      return [user._id, ...teamMembers.map((item) => item._id)];
    }

    return [user._id];
  }

  async getTaskVisibilityQuery(user: AuthUser): Promise<FilterQuery<ITask>> {
    if (user.role === USER_ROLES.MANAGER) {
      return {};
    }

    const visibleUserIds = await this.getVisibleUserIds(user);

    return {
      $or: [{ createdBy: { $in: visibleUserIds } }, { assignedTo: { $in: visibleUserIds } }]
    };
  }

  async canAssignTaskTo(currentUser: AuthUser, assignedToId: string): Promise<boolean> {
    if (currentUser.role === USER_ROLES.MANAGER) {
      return this.userRepository.existsById(assignedToId);
    }

    if (currentUser.role === USER_ROLES.TEAM_LEAD) {
      if (objectIdEquals(currentUser._id, assignedToId)) {
        return true;
      }

      return this.userRepository.existsTeamMember(assignedToId, currentUser._id);
    }

    return objectIdEquals(currentUser._id, assignedToId);
  }

  async canManageTask(currentUser: AuthUser, task: ITask): Promise<boolean> {
    if (currentUser.role === USER_ROLES.MANAGER) {
      return true;
    }

    if (currentUser.role === USER_ROLES.TEAM_LEAD) {
      const visibleUserIds = await this.getVisibleUserIds(currentUser);
      return visibleUserIds.some((id) => objectIdEquals(id, task.createdBy) || objectIdEquals(id, task.assignedTo));
    }

    return objectIdEquals(currentUser._id, task.assignedTo);
  }

  async findAssignableUsers(currentUser: AuthUser): Promise<IUser[]> {
    if (currentUser.role === USER_ROLES.MANAGER) {
      return this.userRepository.findAll();
    }

    if (currentUser.role === USER_ROLES.TEAM_LEAD) {
      return this.userRepository.findSelfAndTeam(currentUser._id);
    }

    const currentUserRecord = await this.userRepository.findById(currentUser._id);
    return currentUserRecord ? [currentUserRecord] : [];
  }
}
