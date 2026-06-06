import { connectDatabase } from '../config/database';
import { TASK_STATUSES } from '../constants/task-status';
import { Task } from '../modules/tasks/models/task.model';
import { User } from '../modules/users/models/user.model';

const seed = async (): Promise<void> => {
  await connectDatabase();

  await Task.deleteMany({});
  await User.deleteMany({});

  const manager = await User.create({
    username: 'Eminence Manager',
    email: 'manager@eminence.com',
    password: 'Password@123',
    role: 'manager'
  });

  const lead = await User.create({
    username: 'Eminence Team Lead',
    email: 'lead@eminence.com',
    password: 'Password@123',
    role: 'teamLead'
  });

  const employee = await User.create({
    username: 'Eminence Employee',
    email: 'employee@eminence.com',
    password: 'Password@123',
    role: 'employee',
    teamLeadId: lead._id
  });

  await Task.create([
    {
      title: 'Prepare onboarding checklist',
      description: 'Create a concise onboarding checklist for new engineering team members.',
      status: TASK_STATUSES.BACKLOG,
      createdBy: manager._id,
      assignedTo: lead._id
    },
    {
      title: 'Update task API validation',
      description: 'Review task payload validation and verify error responses.',
      status: TASK_STATUSES.IN_PROGRESS,
      createdBy: lead._id,
      assignedTo: employee._id
    },
    {
      title: 'Submit daily progress note',
      description: 'Add progress notes for today and mark the task complete after review.',
      status: TASK_STATUSES.COMPLETED,
      createdBy: employee._id,
      assignedTo: employee._id
    }
  ]);

  console.log('Seed completed.');
  console.log('Manager: manager@eminence.com / Password@123');
  console.log('Team Lead: lead@eminence.com / Password@123');
  console.log('Employee: employee@eminence.com / Password@123');
  process.exit(0);
};

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
