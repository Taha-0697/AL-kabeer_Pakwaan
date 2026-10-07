import cron from 'node-cron';
import { runBackup } from './backup-db';

console.log('Starting DB Backup Scheduler...');
console.log('Backup is scheduled to run every day at 23:59.');

// Run at 23:59 every day
cron.schedule('59 23 * * *', async () => {
  console.log('Triggering scheduled daily backup at 23:59...');
  try {
    await runBackup();
    console.log('Daily backup completed successfully.');
  } catch (error) {
    console.error('Scheduled backup failed:', error);
  }
});