import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { generateChallanPDF } from '../services/pdf.service';

export function createPDFWorker(): Worker {
  const worker = new Worker(
    'pdf-generation',
    async (job: Job<{ challanId: string }>) => {
      const { challanId } = job.data;
      console.log(`[PDF Worker] Processing job ${job.id} for challan ${challanId}...`);

      const pdfBuffer = await generateChallanPDF(challanId);
      console.log(`[PDF Worker] Generated ${pdfBuffer.length} bytes for challan ${challanId}`);

      return { status: 'SUCCESS', sizeBytes: pdfBuffer.length };
    },
    {
      connection: getRedisClient(),
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[PDF Worker] Job ${job.id} completed successfully.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[PDF Worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

