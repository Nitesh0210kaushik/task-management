import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { createTask, deleteTask, listTasks, updateTask } from '../controllers/task.controller';

export const taskRouter = Router();

taskRouter.use(authenticate);
taskRouter.get('/', listTasks);
taskRouter.post('/', createTask);
taskRouter.patch('/:id', updateTask);
taskRouter.delete('/:id', deleteTask);

