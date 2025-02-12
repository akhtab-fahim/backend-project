import mongoose, { mongo, Mongoose } from "mongoose";

const likeSChema = new mongoose.Schema({
    video  :{
            type : mongoose.Schema.Types.ObjectId,
            ref : "Video"
    },
    comment  :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Comment"
    },
    tweet  :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Tweet"
    },
    likedBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
    
},{timestamps : true})

export const Like = mongoose.model("Likes",likeSChema)