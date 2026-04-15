import connectDB from "./db/index.js";
import dotenv from 'dotenv'
import { app } from './app.js'

dotenv.config({
    path:'./.env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT, '0.0.0.0', () => {
        console.log(`APP IS LISTENING ON PORT ${process.env.PORT}`);
    });
})