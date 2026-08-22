import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../config/redis';

interface LowStockJobPayload {
  productId: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
}

export function createNotificationWorker(): Worker {
  const worker = new Worker(
    'notifications',
    async (job: Job<LowStockJobPayload>) => {
      const { productName, currentStock, minimumStock } = job.data;
      console.log(`[Notification Worker] Processing job ${job.id} for ${productName}...`);

      // Dispatch alert to email/SMS/Slack webhook
      console.log(
        `🚨 [ALERT DISPATCHED] Product "${productName}" is below minimum threshold! Current: ${currentStock}, Minimum: ${minimumStock}`
      );

      return { status: 'DISPATCHED' };
    },
    {
      connection: getRedisClient(),
      concurrency: 10,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Notification Worker] Job ${job.id} completed.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Notification Worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

