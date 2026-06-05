import { User } from '../models/User';
import { assignTeamLeadSchema } from '../schemas/user.schema';
import { findAssignableUsers } from '../services/permission.service';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { sendResponse } from '../utils/sendResponse';

export const listUsers = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new HttpError(401, 'Authentication is required.');
  }

  if (req.user.role === 'employee') {
    throw new HttpError(403, 'Employees cannot access user management.');
  }

  const users = await findAssignableUsers(req.user);
  sendResponse(res, 200, users);
});

export const assignTeamLead = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new HttpError(401, 'Authentication is required.');
  }

  if (req.user.role !== 'manager') {
    throw new HttpError(403, 'Only managers can assign team leads.');
  }

  const { teamLeadId } = assignTeamLeadSchema.parse(req.body);
  const employee = await User.findById(req.params.id);

  if (!employee) {
    throw new HttpError(404, 'Employee not found.');
  }

  if (employee.role !== 'employee') {
    throw new HttpError(400, 'Only employees can be assigned to a team lead.');
  }

  if (teamLeadId) {
    const teamLead = await User.findOne({ _id: teamLeadId, role: 'teamLead' });

    if (!teamLead) {
      throw new HttpError(400, 'Selected team lead does not exist.');
    }
  }

  employee.teamLeadId = teamLeadId ? (teamLeadId as unknown as typeof employee.teamLeadId) : null;
  await employee.save();

  sendResponse(res, 200, employee, 'Team lead assignment updated.');
});

