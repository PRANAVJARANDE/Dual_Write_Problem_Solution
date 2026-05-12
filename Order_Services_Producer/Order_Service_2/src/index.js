import connectDB from "./db/index.js";
import dotenv from 'dotenv'
import { app } from './app.js'
import { connectKafka } from "./kafka/kafka.js";
import { startConsumer } from "./kafka/consumerHandler.js";

dotenv.config({
    path:'./.env'
})

connectDB()
.then(async() => {
    await connectKafka(); 
    await startConsumer();
    app.listen(process.env.PORT, '0.0.0.0', () => {
        console.log(`APP IS LISTENING ON PORT ${process.env.PORT}`);
    });
})