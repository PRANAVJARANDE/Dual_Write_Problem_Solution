import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";
import { startPoller } from "./utils/poller.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`APP IS LISTENING ON PORT ${PORT}`);
    });
    console.log("ENV PORT:", process.env.PORT);
    startPoller();
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
  });