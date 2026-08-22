import 'dotenv/config';
import app from './app';
import { startBackgroundWorkers } from './workers';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);

  // Start background worker queue if enabled
  if (process.env['REDIS_URL']) {
    startBackgroundWorkers();
  }
});
