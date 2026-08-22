import { Queue, QueueOptions } from 'bullmq';
import { getRedisClient, isRedisConnected } from '../config/redis';
import { generateChallanPDF } from '../services/pdf.service';

const redisConnection = getRedisClient();

const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
};

export const pdfQueue = new Queue('pdf-generation', queueOptions);
export const notificationQueue = new Queue('notifications', queueOptions);

// Enqueue PDF Generation Job
export async function enqueuePDFGeneration(challanId: string) {
  if (isRedisConnected()) {
    return pdfQueue.add('generate-challan-pdf', { challanId });
  }

  // Graceful in-process fallback when Redis is offline
  console.log(`[Queue Fallback] Processing PDF generation in-process for challan: ${challanId}`);
  return generateChallanPDF(challanId);
}

// Enqueue Low Stock Alert Notification Job
export async function enqueueLowStockAlert(payload: {
  productId: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
}) {
  if (isRedisConnected()) {
    return notificationQueue.add('low-stock-alert', payload);
  }

  // Graceful fallback
  console.log(
    `[Notification Fallback] Low stock alert for ${payload.productName}: available ${payload.currentStock} / min ${payload.minimumStock}`
  );
  return null;
}

