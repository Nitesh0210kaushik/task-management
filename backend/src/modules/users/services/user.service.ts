import { Types } from 'mongoose';
import { HTTP_STATUS } from '../../../constants/http';
import { USER_ROLES } from '../../../constants/roles';
import { ApiError } from '../../../utils/ApiError';
import type { AuthUser } from '../../auth/types/auth.types';
import type { AssignTeamLeadDto, CreateUserDto } from '../dtos/user.dto';
import type { IUser } from '../models/user.model';
import { UserRepository } from '../repositories/user.repository';

export class UserService {
  private readonly userRepository = new UserRepository();

  async listVisibleUsers(currentUser: AuthUser): Promise<IUser[]> {
    if (currentUser.role === USER_ROLES.EMPLOYEE) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Employees cannot access user management.');
    }

    if (currentUser.role === USER_ROLES.MANAGER) {
      return this.userRepository.findAll();
    }

    return this.userRepository.findSelfAndTeam(currentUser._id);
  }

  async createUser(currentUser: AuthUser, payload: CreateUserDto): Promise<IUser> {
    if (currentUser.role !== USER_ROLES.MANAGER) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Only managers can create team leads.');
    }

    const existingUser = await this.userRepository.findByEmail(payload.email);

    if (existingUser) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Email is already registered.');
    }

    return this.userRepository.create({
      username: payload.username,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      teamLeadId: null
    });
  }

  async assignTeamLead(currentUser: AuthUser, employeeId: string, payload: AssignTeamLeadDto): Promise<IUser> {
    if (currentUser.role !== USER_ROLES.MANAGER) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Only managers can assign team leads.');
    }

    const employee = await this.userRepository.findById(employeeId);

    if (!employee) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Employee not found.');
    }

    if (employee.role !== USER_ROLES.EMPLOYEE) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Only employees can be assigned to a team lead.');
    }

    if (payload.teamLeadId) {
      const teamLead = await this.userRepository.findById(payload.teamLeadId);

      if (!teamLead || teamLead.role !== USER_ROLES.TEAM_LEAD) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Selected team lead does not exist.');
      }
    }

    employee.teamLeadId = payload.teamLeadId ? new Types.ObjectId(payload.teamLeadId) : null;
    await employee.save();

    return employee;
  }
}
