import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";
import { startPoller } from "./utils/poller.js";
import { startCleanupJob } from "./utils/cleanup.js";
import { connectKafka } from "./utils/kafka.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8000;

connectDB()
  .then(async () => {  
    await connectKafka(); 
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`APP IS LISTENING ON PORT ${PORT}`);
    });

    startPoller();
    startCleanupJob();
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
  });