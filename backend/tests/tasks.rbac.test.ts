import { describe, expect, it } from 'vitest';
import { LEGACY_TASK_STATUSES, TASK_STATUSES } from '../src/constants/task-status';
import { USER_ROLES } from '../src/constants/roles';
import { Task } from '../src/modules/tasks/models/task.model';
import { api, bearer, createTestUser, getRecordId, loginTestUser, seedWorkspace } from './helpers';

describe('Task API RBAC and CRUD', () => {
  it('auto-assigns employee-created tasks to self', async () => {
    const manager = await createTestUser({ role: USER_ROLES.MANAGER });
    const employee = await createTestUser({ role: USER_ROLES.EMPLOYEE });
    const { token } = await loginTestUser(employee);

    const response = await api
      .post('/api/tasks')
      .set('Authorization', bearer(token))
      .send({
        title: 'Employee self task',
        description: 'Employee task should ignore foreign assignment.',
        assignedTo: manager.id
      });

    expect(response.status).toBe(201);
    expect(getRecordId(response.body.data.createdBy)).toBe(employee.id);
    expect(getRecordId(response.body.data.assignedTo)).toBe(employee.id);
  });

  it('allows managers to assign anyone and team leads to assign only their team', async () => {
    const { manager, teamLead, employee, outsideEmployee } = await seedWorkspace();
    const managerAuth = await loginTestUser(manager);
    const teamLeadAuth = await loginTestUser(teamLead);

    const managerTaskResponse = await api
      .post('/api/tasks')
      .set('Authorization', bearer(managerAuth.token))
      .send({
        title: 'Manager assigned task',
        description: 'Manager can assign to any existing user.',
        assignedTo: outsideEmployee.id
      });

    expect(managerTaskResponse.status).toBe(201);
    expect(getRecordId(managerTaskResponse.body.data.assignedTo)).toBe(outsideEmployee.id);

    const teamTaskResponse = await api
      .post('/api/tasks')
      .set('Authorization', bearer(teamLeadAuth.token))
      .send({
        title: 'Team task',
        description: 'Team lead can assign to team member.',
        assignedTo: employee.id
      });

    expect(teamTaskResponse.status).toBe(201);
    expect(getRecordId(teamTaskResponse.body.data.assignedTo)).toBe(employee.id);

    const blockedResponse = await api
      .post('/api/tasks')
      .set('Authorization', bearer(teamLeadAuth.token))
      .send({
        title: 'Outside team task',
        description: 'Team lead cannot assign outside own team.',
        assignedTo: outsideEmployee.id
      });

    expect(blockedResponse.status).toBe(403);
  });

  it('enforces task visibility and status filtering', async () => {
    const { manager, teamLead, employee, outsideEmployee } = await seedWorkspace();
    const managerAuth = await loginTestUser(manager);
    const teamLeadAuth = await loginTestUser(teamLead);
    const employeeAuth = await loginTestUser(employee);
    const outsideAuth = await loginTestUser(outsideEmployee);

    await api
      .post('/api/tasks')
      .set('Authorization', bearer(managerAuth.token))
      .send({
        title: 'Backlog team task',
        description: 'Visible to manager and assigned team lead.',
        status: TASK_STATUSES.BACKLOG,
        assignedTo: employee.id
      });

    await api
      .post('/api/tasks')
      .set('Authorization', bearer(managerAuth.token))
      .send({
        title: 'Outside in progress task',
        description: 'Only manager and outside employee should see this.',
        status: TASK_STATUSES.IN_PROGRESS,
        assignedTo: outsideEmployee.id
      });

    const managerTasks = await api.get('/api/tasks').set('Authorization', bearer(managerAuth.token));
    const teamLeadTasks = await api.get('/api/tasks').set('Authorization', bearer(teamLeadAuth.token));
    const employeeTasks = await api.get('/api/tasks').set('Authorization', bearer(employeeAuth.token));
    const outsideTasks = await api.get('/api/tasks').set('Authorization', bearer(outsideAuth.token));
    const filteredTasks = await api
      .get(`/api/tasks?status=${TASK_STATUSES.IN_PROGRESS}`)
      .set('Authorization', bearer(managerAuth.token));
    const pendingAliasTasks = await api
      .get(`/api/tasks?status=${LEGACY_TASK_STATUSES.PENDING}`)
      .set('Authorization', bearer(managerAuth.token));
    const titleSearchTasks = await api
      .get('/api/tasks')
      .query({ search: 'Backlog' })
      .set('Authorization', bearer(managerAuth.token));
    const assigneeSearchTasks = await api
      .get('/api/tasks')
      .query({ search: 'Outside' })
      .set('Authorization', bearer(managerAuth.token));
    const combinedFilterTasks = await api
      .get('/api/tasks')
      .query({ status: TASK_STATUSES.BACKLOG, search: 'team' })
      .set('Authorization', bearer(managerAuth.token));

    expect(managerTasks.body.data).toHaveLength(2);
    expect(teamLeadTasks.body.data).toHaveLength(1);
    expect(employeeTasks.body.data).toHaveLength(1);
    expect(outsideTasks.body.data).toHaveLength(1);
    expect(filteredTasks.body.data).toHaveLength(1);
    expect(filteredTasks.body.data[0].status).toBe(TASK_STATUSES.IN_PROGRESS);
    expect(pendingAliasTasks.body.data).toHaveLength(1);
    expect(pendingAliasTasks.body.data[0].status).toBe(TASK_STATUSES.BACKLOG);
    expect(titleSearchTasks.body.data).toHaveLength(1);
    expect(titleSearchTasks.body.data[0].title).toBe('Backlog team task');
    expect(assigneeSearchTasks.body.data).toHaveLength(1);
    expect(assigneeSearchTasks.body.data[0].title).toBe('Outside in progress task');
    expect(combinedFilterTasks.body.data).toHaveLength(1);
    expect(combinedFilterTasks.body.data[0].status).toBe(TASK_STATUSES.BACKLOG);
  });

  it('blocks unauthorized updates and supports manager update/delete', async () => {
    const { manager, employee, outsideEmployee } = await seedWorkspace();
    const managerAuth = await loginTestUser(manager);
    const employeeAuth = await loginTestUser(employee);

    const createResponse = await api
      .post('/api/tasks')
      .set('Authorization', bearer(managerAuth.token))
      .send({
        title: 'Restricted task',
        description: 'Employee should not manage another employee task.',
        assignedTo: outsideEmployee.id
      });

    const blockedResponse = await api
      .patch(`/api/tasks/${createResponse.body.data.id}`)
      .set('Authorization', bearer(employeeAuth.token))
      .send({ status: TASK_STATUSES.COMPLETED });

    expect(blockedResponse.status).toBe(403);

    const updateResponse = await api
      .patch(`/api/tasks/${createResponse.body.data.id}`)
      .set('Authorization', bearer(managerAuth.token))
      .send({ status: TASK_STATUSES.COMPLETED });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.status).toBe(TASK_STATUSES.COMPLETED);

    const deleteResponse = await api
      .delete(`/api/tasks/${createResponse.body.data.id}`)
      .set('Authorization', bearer(managerAuth.token));

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.id).toBe(createResponse.body.data.id);
    expect(deleteResponse.body.data.isDeleted).toBe(true);

    const deletedTask = await Task.findById(createResponse.body.data.id).lean();
    expect(deletedTask).toBeTruthy();
    expect(deletedTask?.isDeleted).toBe(true);
    expect(deletedTask?.deletedAt).toBeTruthy();

    const managerTasksAfterDelete = await api.get('/api/tasks').set('Authorization', bearer(managerAuth.token));
    const updateDeletedTaskResponse = await api
      .patch(`/api/tasks/${createResponse.body.data.id}`)
      .set('Authorization', bearer(managerAuth.token))
      .send({ status: TASK_STATUSES.BACKLOG });

    expect(managerTasksAfterDelete.body.data).toHaveLength(0);
    expect(updateDeletedTaskResponse.status).toBe(404);
  });

  it('allows employees to update only tasks assigned to them', async () => {
    const { manager, employee, outsideEmployee } = await seedWorkspace();
    const managerAuth = await loginTestUser(manager);
    const employeeAuth = await loginTestUser(employee);

    const assignedTaskResponse = await api
      .post('/api/tasks')
      .set('Authorization', bearer(managerAuth.token))
      .send({
        title: 'Employee owned task',
        description: 'Employee can move a task assigned to them.',
        assignedTo: employee.id
      });

    const ownedUpdateResponse = await api
      .patch(`/api/tasks/${assignedTaskResponse.body.data.id}`)
      .set('Authorization', bearer(employeeAuth.token))
      .send({ status: TASK_STATUSES.IN_PROGRESS });

    expect(ownedUpdateResponse.status).toBe(200);
    expect(ownedUpdateResponse.body.data.status).toBe(TASK_STATUSES.IN_PROGRESS);

    const createdButNotAssignedTask = await Task.create({
      title: 'Created but not assigned',
      description: 'Employee should not update tasks assigned to someone else.',
      status: TASK_STATUSES.BACKLOG,
      createdBy: employee._id,
      assignedTo: outsideEmployee._id
    });

    const blockedUpdateResponse = await api
      .patch(`/api/tasks/${createdButNotAssignedTask.id}`)
      .set('Authorization', bearer(employeeAuth.token))
      .send({ status: TASK_STATUSES.COMPLETED });

    expect(blockedUpdateResponse.status).toBe(403);
  });
});
