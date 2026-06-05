import { Types } from 'mongoose';
import { User, type IUser } from '../models/User';
import type { ITask } from '../models/Task';
import type { AuthUser } from '../types/auth';

const objectIdEquals = (left: Types.ObjectId | string, right: Types.ObjectId | string): boolean => {
  return left.toString() === right.toString();
};

export const getVisibleUserIds = async (user: AuthUser): Promise<Types.ObjectId[]> => {
  if (user.role === 'manager') {
    const users = await User.find().select('_id');
    return users.map((item) => item._id);
  }

  if (user.role === 'teamLead') {
    const teamMembers = await User.find({ teamLeadId: user._id }).select('_id');
    return [user._id, ...teamMembers.map((item) => item._id)];
  }

  return [user._id];
};

export const getTaskVisibilityQuery = async (user: AuthUser) => {
  if (user.role === 'manager') {
    return {};
  }

  const visibleUserIds = await getVisibleUserIds(user);

  return {
    $or: [{ createdBy: { $in: visibleUserIds } }, { assignedTo: { $in: visibleUserIds } }]
  };
};

export const canAssignTaskTo = async (currentUser: AuthUser, assignedToId: string): Promise<boolean> => {
  if (currentUser.role === 'manager') {
    return Boolean(await User.exists({ _id: assignedToId }));
  }

  if (currentUser.role === 'teamLead') {
    if (objectIdEquals(currentUser._id, assignedToId)) {
      return true;
    }

    return Boolean(
      await User.exists({
        _id: assignedToId,
        teamLeadId: currentUser._id
      })
    );
  }

  return objectIdEquals(currentUser._id, assignedToId);
};

export const canManageTask = async (currentUser: AuthUser, task: ITask): Promise<boolean> => {
  if (currentUser.role === 'manager') {
    return true;
  }

  if (currentUser.role === 'teamLead') {
    const visibleUserIds = await getVisibleUserIds(currentUser);
    return visibleUserIds.some((id) => objectIdEquals(id, task.createdBy) || objectIdEquals(id, task.assignedTo));
  }

  return objectIdEquals(currentUser._id, task.createdBy) || objectIdEquals(currentUser._id, task.assignedTo);
};

export const findAssignableUsers = async (currentUser: AuthUser): Promise<IUser[]> => {
  if (currentUser.role === 'manager') {
    return User.find().sort({ role: 1, username: 1 });
  }

  if (currentUser.role === 'teamLead') {
    return User.find({
      $or: [{ _id: currentUser._id }, { teamLeadId: currentUser._id }]
    }).sort({ role: 1, username: 1 });
  }

  return User.find({ _id: currentUser._id });
};

