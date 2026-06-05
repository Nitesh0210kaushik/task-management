import { Router } from 'express';
import { createTask, deleteTask, listTasks, updateTask } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';

export const taskRouter = Router();

taskRouter.use(authenticate);
taskRouter.get('/', listTasks);
taskRouter.post('/', createTask);
taskRouter.patch('/:id', updateTask);
taskRouter.delete('/:id', deleteTask);

