import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import {
  getChallans,
  getChallan,
  createChallan,
  updateChallan,
  confirmChallan,
  cancelChallan,
} from '../controllers/challan.controller';

const challanRouter = Router();

challanRouter.use(authenticate);

// Read — ADMIN, SALES, ACCOUNTS
challanRouter.get('/', authorize('ADMIN', 'SALES', 'ACCOUNTS'), getChallans);
challanRouter.get('/:id', authorize('ADMIN', 'SALES', 'ACCOUNTS'), getChallan);

// Create / Edit draft — ADMIN, SALES
challanRouter.post('/', authorize('ADMIN', 'SALES'), createChallan);
challanRouter.put('/:id', authorize('ADMIN', 'SALES'), updateChallan);

// Confirm / Cancel — ADMIN, SALES
challanRouter.post('/:id/confirm', authorize('ADMIN', 'SALES'), confirmChallan);
challanRouter.post('/:id/cancel', authorize('ADMIN', 'SALES'), cancelChallan);

export default challanRouter;
