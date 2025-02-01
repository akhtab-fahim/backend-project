import app from './app.js';

import connectDB from './db/index.js';

connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MONGODB connection fail ",err);
    
})

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

