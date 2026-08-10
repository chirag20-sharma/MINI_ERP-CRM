import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { getProducts, getProduct, createProduct, updateProduct } from '../controllers/product.controller';

const productRouter = Router();

productRouter.use(authenticate);

// Read — all authenticated roles
productRouter.get('/', authorize('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), getProducts);
productRouter.get('/:id', authorize('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), getProduct);

// Write — ADMIN and WAREHOUSE only
productRouter.post('/', authorize('ADMIN', 'WAREHOUSE'), createProduct);
productRouter.put('/:id', authorize('ADMIN', 'WAREHOUSE'), updateProduct);

export default productRouter;
