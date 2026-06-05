import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { getDashboardOverview } from '../controllers/dashboard.controller';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);
dashboardRouter.get('/overview', getDashboardOverview);
