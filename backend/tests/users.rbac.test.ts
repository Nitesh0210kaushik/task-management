import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '../src/constants/roles';
import { User } from '../src/modules/users/models/user.model';
import { api, bearer, createTestUser, loginTestUser, seedWorkspace, testPassword, uniqueEmail } from './helpers';

describe('User management RBAC', () => {
  it('allows managers to create team leads and list all users', async () => {
    const manager = await createTestUser({ role: USER_ROLES.MANAGER, username: 'Manager' });
    const employee = await createTestUser({ role: USER_ROLES.EMPLOYEE, username: 'Employee' });
    const { token } = await loginTestUser(manager);

    const createResponse = await api
      .post('/api/users')
      .set('Authorization', bearer(token))
      .send({
        username: 'Created Team Lead',
        email: uniqueEmail('created-lead'),
        password: testPassword,
        role: USER_ROLES.TEAM_LEAD
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.role).toBe(USER_ROLES.TEAM_LEAD);

    const listResponse = await api.get('/api/users').set('Authorization', bearer(token));
    const ids = listResponse.body.data.map((user: { id: string }) => user.id);

    expect(listResponse.status).toBe(200);
    expect(ids).toContain(manager.id);
    expect(ids).toContain(employee.id);
    expect(ids).toContain(createResponse.body.data.id);
  });

  it('limits team leads to self and assigned team members', async () => {
    const { manager, teamLead, employee, outsideEmployee } = await seedWorkspace();
    const { token } = await loginTestUser(teamLead);

    const response = await api.get('/api/users').set('Authorization', bearer(token));
    const ids = response.body.data.map((user: { id: string }) => user.id);

    expect(response.status).toBe(200);
    expect(ids).toContain(teamLead.id);
    expect(ids).toContain(employee.id);
    expect(ids).not.toContain(manager.id);
    expect(ids).not.toContain(outsideEmployee.id);
  });

  it('blocks employees from user management and lets managers assign team leads', async () => {
    const { manager, teamLead, employee } = await seedWorkspace();
    const managerAuth = await loginTestUser(manager);
    const employeeAuth = await loginTestUser(employee);

    const blockedResponse = await api.get('/api/users').set('Authorization', bearer(employeeAuth.token));

    expect(blockedResponse.status).toBe(403);

    const assignResponse = await api
      .patch(`/api/users/${employee.id}/team-lead`)
      .set('Authorization', bearer(managerAuth.token))
      .send({ teamLeadId: teamLead.id });

    expect(assignResponse.status).toBe(200);

    const updatedEmployee = await User.findById(employee.id);
    expect(updatedEmployee?.teamLeadId?.toString()).toBe(teamLead.id);
  });
});
