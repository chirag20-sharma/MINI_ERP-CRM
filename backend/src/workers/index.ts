import { createPDFWorker } from './pdf.worker';
import { createNotificationWorker } from './notification.worker';
import { isRedisConnected } from '../config/redis';

export function startBackgroundWorkers() {
  if (process.env['ENABLE_WORKERS'] === 'false') {
    console.log('Background workers disabled by environment configuration.');
    return;
  }

  try {
    const pdfWorker = createPDFWorker();
    const notificationWorker = createNotificationWorker();

    console.log('🚀 Background workers initialized (PDF & Notifications).');

    return { pdfWorker, notificationWorker };
  } catch (err) {
    console.error('Failed to initialize background workers:', err);
  }
}

