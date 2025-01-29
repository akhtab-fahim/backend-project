import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/videostreamingplatform1`);

        console.log(`MONGODB connected: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error(`MONGODB connection error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

export default connectDB;
