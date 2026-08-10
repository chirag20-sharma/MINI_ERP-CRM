import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getDashboard } from '../controllers/dashboard.controller';

const dashboardRouter = Router();
dashboardRouter.use(authenticate);
dashboardRouter.get('/', getDashboard);

export default dashboardRouter;
