import { pool } from "../db/index.js";

const BATCH_SIZE = 10;
const POLL_INTERVAL = 1000;

export async function startPoller() {
  console.log(" Poller started...");

  while (true) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const res = await client.query(`
        SELECT *
        FROM "Outbox"
        WHERE status = 'PENDING'
        ORDER BY "createdAt"
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      `, [BATCH_SIZE]);

      const events = res.rows;

      if (events.length === 0) {
        await client.query("COMMIT");
        client.release();
        await sleep(POLL_INTERVAL);
        continue;
      }

      if (events.length > 0) {
        events.forEach((event, index) => {
            console.log(`\n🔹 Event #${index + 1}`);
            console.log("ID:", event.id);
            console.log("Status:", event.status);
            console.log("Attempts:", event.attempts);
            console.log("FailureRate:", event.failureRate);
            console.log("SimulationMode:", event.simulationMode);
            console.log("Payload:", JSON.stringify(event.payload, null, 2));
        });
        }

      for (const event of events) {
        console.log(` Locking & marking PROCESSING: ${event.id}`);
        await client.query(`
          UPDATE "Outbox"
          SET status = 'PROCESSING', "updatedAt" = NOW()
          WHERE id = $1
        `, [event.id]);
      }

      await client.query("COMMIT");
      client.release();

      for (const event of events) {
        try {
            await handleEvent(event);
        } catch (err) {
            console.log("Unexpected error:", err.message);

            await pool.query(`
            UPDATE "Outbox"
            SET status = 'PENDING',
                attempts = attempts + 1,
                "lastError" = $1,
                "updatedAt" = NOW()
            WHERE id = $2
            `, [err.message, event.id]);
        }
        }

            } catch (err) {
            await client.query("ROLLBACK");
            client.release();
            console.error("TX ERROR:", err);
            }

            await sleep(POLL_INTERVAL);
        }
    }

async function handleEvent(event) {
  console.log(" Processing:", event.id);

  const random = Math.random();

  if (random < 0.90) {
    console.log(" Fell into failure region, doing nothing:", event.id);

    await pool.query(`
      UPDATE "Outbox"
      SET status = 'PENDING',
          attempts = attempts + 1,
          "updatedAt" = NOW()
      WHERE id = $1
    `, [event.id]);

    return;
  }

  console.log("✅ Success region:", event.id);

  console.log("➡️ Payload:", event.payload);


  await pool.query(`
    UPDATE "Outbox"
    SET status = 'SENT',
        "processedAt" = NOW(),
        "updatedAt" = NOW()
    WHERE id = $1
  `, [event.id]);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}