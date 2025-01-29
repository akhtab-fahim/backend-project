// require('dotenv').config({path: './env'}); 
import express from 'express';

const app = express();

import connectDB from './db/index.js';

connectDB()

/*

//DB conncetion 
(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error",(err)=>{console.log(err + "DB error")})

        app.listen(process.env.PORT,()=>{
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    }
    catch(e){
        console.error("Error",e);
    }   
})()

*/

