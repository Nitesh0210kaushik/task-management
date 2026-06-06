import { describe, expect, it } from 'vitest';
import { Notification } from '../src/modules/notifications/models/notification.model';
import { api, bearer, loginTestUser, seedWorkspace } from './helpers';

describe('Notification API', () => {
  it('persists task notifications in MongoDB and marks them as read', async () => {
    const { manager, teamLead, employee } = await seedWorkspace();
    const managerAuth = await loginTestUser(manager);
    const teamLeadAuth = await loginTestUser(teamLead);
    const employeeAuth = await loginTestUser(employee);

    const taskResponse = await api
      .post('/api/tasks')
      .set('Authorization', bearer(managerAuth.token))
      .send({
        title: 'Notify assigned users',
        description: 'Task changes should create persisted notifications.',
        assignedTo: employee.id
      });

    expect(taskResponse.status).toBe(201);

    const leadNotifications = await api.get('/api/notifications').set('Authorization', bearer(teamLeadAuth.token));
    const employeeNotifications = await api.get('/api/notifications').set('Authorization', bearer(employeeAuth.token));
    const managerNotifications = await api.get('/api/notifications').set('Authorization', bearer(managerAuth.token));

    expect(leadNotifications.status).toBe(200);
    expect(leadNotifications.body.data).toHaveLength(1);
    expect(leadNotifications.body.data[0].read).toBe(false);
    expect(leadNotifications.body.data[0].message).toContain('Notify assigned users');
    expect(employeeNotifications.body.data).toHaveLength(1);
    expect(managerNotifications.body.data).toHaveLength(1);

    const markOneReadResponse = await api
      .patch(`/api/notifications/${leadNotifications.body.data[0].id}/read`)
      .set('Authorization', bearer(teamLeadAuth.token))
      .send({});

    expect(markOneReadResponse.status).toBe(200);
    expect(markOneReadResponse.body.data.read).toBe(true);
    expect(markOneReadResponse.body.data.readAt).toBeTruthy();

    const markReadResponse = await api
      .patch('/api/notifications/read')
      .set('Authorization', bearer(teamLeadAuth.token))
      .send({});

    expect(markReadResponse.status).toBe(200);
    expect(markReadResponse.body.data.updatedCount).toBe(0);

    const refreshedNotifications = await api.get('/api/notifications').set('Authorization', bearer(teamLeadAuth.token));

    expect(refreshedNotifications.body.data[0].read).toBe(true);

    const deleteResponse = await api
      .delete(`/api/notifications/${leadNotifications.body.data[0].id}`)
      .set('Authorization', bearer(teamLeadAuth.token));

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.isDeleted).toBe(true);

    const deletedNotificationRecord = await Notification.findById(leadNotifications.body.data[0].id).lean();
    expect(deletedNotificationRecord).toBeTruthy();
    expect(deletedNotificationRecord?.isDeleted).toBe(true);
    expect(deletedNotificationRecord?.deletedAt).toBeTruthy();

    const notificationsAfterDelete = await api.get('/api/notifications').set('Authorization', bearer(teamLeadAuth.token));
    expect(notificationsAfterDelete.body.data).toHaveLength(0);
  });
});
