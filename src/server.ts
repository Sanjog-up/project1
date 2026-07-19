import "dotenv/config"; 
import app from "./app";
import connectDatabase from "./config/db.config";

const PORT = process.env.PORT || 8000;
const DB_URI = process.env.DB_URI as string;

export const server = async() => {
    await connectDatabase(DB_URI)
    app.listen(PORT ,()=> {
    console.log(`server is running on http://localhost:${PORT}`)
})
}
server();