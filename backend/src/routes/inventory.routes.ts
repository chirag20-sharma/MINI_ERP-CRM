import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import {
  getMovements,
  getMovementsByProduct,
  handleStockIn,
  handleStockOut,
} from '../controllers/inventory.controller';

const inventoryRouter = Router();

inventoryRouter.use(authenticate);

// Read — all authenticated roles
inventoryRouter.get('/stock-movements', authorize('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), getMovements);
inventoryRouter.get('/stock-movements/:productId', authorize('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), getMovementsByProduct);

// Write — ADMIN and WAREHOUSE only
inventoryRouter.post('/stock-in', authorize('ADMIN', 'WAREHOUSE'), handleStockIn);
inventoryRouter.post('/stock-out', authorize('ADMIN', 'WAREHOUSE'), handleStockOut);

export default inventoryRouter;
