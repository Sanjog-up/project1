import mongoose from "mongoose";

const connectDatabase = async (DB_URI: string) => {
    try {
        await mongoose.connect(DB_URI)
        console.log("Database connected");
    } catch (error) {
        console.log("---Database connection error---", error)
    }
}
export default connectDatabase;