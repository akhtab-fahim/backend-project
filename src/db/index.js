import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from 'dotenv';
dotenv.config({path : "./env"});

const connectDB = async ()=> {
    try {
      const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}` , {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log(`\n MONGODB connected DB HOST ${connectionInstance.connection.host}`);
      
      
    } catch (error) {
        console.log(error + "MONGODB connection error");
        
    }
}

export default connectDB;