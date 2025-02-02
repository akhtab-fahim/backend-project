import mongoose, { mongo, Mongoose } from "mongoose";
import jwt from "jsonwebtoken";

import bycrypt from "bcrypt"

const userSchema = new mongoose.Schema({

    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        index : true //makes it searchable 
    },
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
    },
    fullname : {
        type : String,
        required : true,
        lowercase : true,
        trim : true,
        index : true
    },
    avatar : {
        type : String, //cluodinary url
        required : true,
    },
    coverimage : {
        type : String, //cluodinary url
        required : true,
    },
    watchHistory : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Video"

        } 
    ],
    password : {
        type : String,
        required : [true, "Password is required " ]

    },
    refreshToken : {
        type : String
    }

},{timestamps : true})

//pre hook
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bycrypt.hash(this.password, 10)
    next()
})


//methods 

userSchema.methods.isPasswordCorrect = async function(password){
    return await bycrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    })
}


export const User = mongoose.model("User",userSchema)