import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import healthRouter from './routes/health.routes';
import authRouter from './routes/auth.routes';
import customerRouter from './routes/customer.routes';
import productRouter from './routes/product.routes';
import inventoryRouter from './routes/inventory.routes';
import challanRouter from './routes/challan.routes';
import dashboardRouter from './routes/dashboard.routes';

const app: Application = express();

// Middleware
const allowedOrigin = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';
app.use(cors({
  origin: process.env['NODE_ENV'] === 'production' ? allowedOrigin : true,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/customers', customerRouter);
app.use('/api/products', productRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/challans', challanRouter);
app.use('/api/dashboard', dashboardRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

export default app;
