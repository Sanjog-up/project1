import "dotenv/config"; 
import app from "./app";
import connectDatabase from "./config/db.config";
import { expireBookings } from "./controllers/booking.controller";
import ENV_CONFIG from "./config/env.config";

const PORT = process.env.PORT || 8000;
const DB_URI = ENV_CONFIG.db_uri as string;

export const server = async() => {
    await connectDatabase(DB_URI)
    expireBookings(); // Start the booking expiration interval
    app.listen(PORT ,()=> {
    console.log(`server is running on http://localhost:${PORT}`)
})
}
server().catch((error) => {
    console.error("Error starting server:", error);
    process.exit(1);
});