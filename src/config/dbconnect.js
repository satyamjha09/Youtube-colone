import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        // Correct the connection string by appending the database name properly
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

        // Log the connection host (or other details)
        console.table(`\nMONGODB CONNECTED!! DB Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};

export default connectDB;
