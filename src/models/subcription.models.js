import mongoose, { mongo, Schema } from "mongoose";

const subcriptionSchema = new mongoose.Schema({
    subscriber : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    channel : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
},{timeseries : true})

const Subscription = mongoose.model("Subscription",subcriptionSchema)