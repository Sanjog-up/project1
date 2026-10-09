import mongoose from "mongoose";

const connectDatabase = async (DB_URI: string) => {
        await mongoose.connect(DB_URI)
        console.log("Database connected");
    }
export default connectDatabase;