import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  createFollowUp,
  getFollowUps,
} from '../controllers/customer.controller';

const customerRouter = Router();

// All customer routes require authentication
customerRouter.use(authenticate);

// Read — ADMIN, SALES, ACCOUNTS
customerRouter.get('/', authorize('ADMIN', 'SALES', 'ACCOUNTS'), getCustomers);
customerRouter.get('/:id', authorize('ADMIN', 'SALES', 'ACCOUNTS'), getCustomer);
customerRouter.get('/:id/followups', authorize('ADMIN', 'SALES', 'ACCOUNTS'), getFollowUps);

// Write — ADMIN, SALES only
customerRouter.post('/', authorize('ADMIN', 'SALES'), createCustomer);
customerRouter.put('/:id', authorize('ADMIN', 'SALES'), updateCustomer);
customerRouter.post('/:id/followups', authorize('ADMIN', 'SALES'), createFollowUp);

export default customerRouter;
