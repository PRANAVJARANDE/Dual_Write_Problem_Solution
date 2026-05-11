import { pool } from "../db/index.js";

const cleanup_interval=process.env.CLEANUP_INTERVAL

export function startCleanupJob() {
  console.log("------------------- Cleanups scheduled at 5mins cycle -----------------------------------------------------------------------");
  setInterval(async () => 
  {
    try 
    {
      console.log("Running cleanup...");
      const result = await pool.query(`
        DELETE FROM "Outbox_Listen_To_yourself"
        WHERE status = 'SENT'
        AND "processedAt" < NOW() - INTERVAL '5 minutes'
      `);

      console.log(`Deleted ${result.rowCount} SENT events`);

    } catch (err) {
      console.error(" Cleanup failed:", err.message);
    }
  }, cleanup_interval);
}