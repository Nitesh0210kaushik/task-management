import { connectDatabase } from '../config/database';
import { Task } from '../models/Task';
import { User } from '../models/User';

const seed = async (): Promise<void> => {
  await connectDatabase();

  await Task.deleteMany({});
  await User.deleteMany({});

  const manager = await User.create({
    username: 'Demo Manager',
    email: 'manager@example.com',
    password: 'Password@123',
    role: 'manager'
  });

  const lead = await User.create({
    username: 'Demo Team Lead',
    email: 'lead@example.com',
    password: 'Password@123',
    role: 'teamLead'
  });

  const employee = await User.create({
    username: 'Demo Employee',
    email: 'employee@example.com',
    password: 'Password@123',
    role: 'employee',
    teamLeadId: lead._id
  });

  await Task.create([
    {
      title: 'Prepare onboarding checklist',
      description: 'Create a concise onboarding checklist for new engineering team members.',
      status: 'pending',
      createdBy: manager._id,
      assignedTo: lead._id
    },
    {
      title: 'Update task API validation',
      description: 'Review task payload validation and verify error responses.',
      status: 'pending',
      createdBy: lead._id,
      assignedTo: employee._id
    },
    {
      title: 'Submit daily progress note',
      description: 'Add progress notes for today and mark the task complete after review.',
      status: 'completed',
      createdBy: employee._id,
      assignedTo: employee._id
    }
  ]);

  console.log('Seed completed.');
  console.log('Manager: manager@example.com / Password@123');
  console.log('Team Lead: lead@example.com / Password@123');
  console.log('Employee: employee@example.com / Password@123');
  process.exit(0);
};

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});

