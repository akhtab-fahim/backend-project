import {asyncHandler} from "../utils/asynchandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { upload } from "../middlewares/multer.middlware.js"
import { uploadOnCloud } from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { Mongoose } from "mongoose"

const generateAccessRefreshTokens = async(userId)=> {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Somthing went wrong while generating refresh and access token ")
    }

}

const registerUser = asyncHandler( async (req,res) => {
    const {fullname, email, username, password} = req.body
    // console.log(req.body)

    /* validation */

    // if(fullname === ""){
    //     throw new ApiError(400,"full name is required");
    // }

    if([fullname,email,username,password].some((field)=> field?.trim() === "")){
        throw new ApiError(400,"all fields are required")
    }
    
    /* Check user already exists or not */
    const existedUser = await User.findOne({
        $or : [{ username },{ email }]
    })
    
    if(existedUser){
        throw new ApiError(409,"User already existed")
    }
    
    console.log(req.files)
    if (!req.files || !req.files.avatar) {
        console.error("req.files:", req.files); // Debug log
        throw new ApiError(400, "Avatar file is required");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;

    //optional chainning : if req.files exists then acces the avatar(first element of the arrat) if avatar[0] exits then access the path of that element
    
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    //     const coverImageLocalPath = req.files.coverImage[0].path;
    // }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required")
    }

    const avatar = await uploadOnCloud(avatarLocalPath)

    const coverImage = await uploadOnCloud(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is must required ")
    }    

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverimage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

//.select() specifies which fields should or should not be included in the query result.
// The - sign before a field name (password, refreshToken) means exclude these fields.
// Without the -, it would mean to include only the specified fields.

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" 
    )

    if(!createdUser) {
        throw new ApiError(500,"No user created")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser, "User registered Succesfully ")
    )

})

const loginUser = asyncHandler(async (req,res) => {
    const {email,username,password} = req.body
    if(!username && !email){
        throw new ApiError(400,"username or email one is must required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    console.log(user);
    

    if(!user){
        throw new ApiError(404,"user doesnt exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"password incorrect")
    }

    const {accessToken,refreshToken} = await generateAccessRefreshTokens(user._id)

    const loggedUser = await User.findById(user._id).select("-password -refreshToken")

    //cookies 

    const options = {
        httpOnly : true,
        secure : true   //only can be modified within server
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,loggedUser,"User logged in Succesfully "))
})  


const logOutUser = asyncHandler(async(req,res)=>{
    
    await User.findOneAndUpdate(req.user._id,
        {
            $unset : {
                refreshToken : 1    //in unset you have to set the flag will remove the field from the document 
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true   //only can be modified within server
    }

    return res.status(200).clearCookie("accesToken",options).clearCookie("refreshToken",options)
    .json(new ApiResponse(200,
        {},"User logged out Succesfully ")
    )
    
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshAccessToken

    if(!incomingRefreshToken){
        throw new ApiError(400,"Unauthorized request")
    }
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken._id)

    if(!user){
        throw new ApiError(401,"Invalid refresh token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401,"refresh token not valid ")
        
    }

    const options = {
        httpOnly : true,
        secure : true   //only can be modified within server
    }

    const {accessToken,newRefreshToken} = await generateAccessRefreshTokens(user._id)

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options)
    .json( new ApiResponse(200),{},"Access token refreshed ")
})

const changeCurrentUser = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body

    const user = await User.findById(req.user?.id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res.status(200).json(
        new ApiResponse(200,{},"password changed succesfully ")
    )
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(
        new ApiResponse(200,req.user,"Cuurent User Fetch Successfullt")
    )
})

const updateAccoutDetails = asyncHandler(async(req,res)=>{
    const {fullname,email} = req.body

    if(!(fullname || email)){
        throw new ApiError(400,"All fields are required ")
    }

    
    const user = await User.findOneAndUpdate(req.user?._id,
        {
            $set : {fullname : fullname,
                email : email}
        },{
            new : true
        }
    ).select("-password")

    res.status(200).json(new ApiResponse(200,user,"Account details updated succesfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file.path 

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar missing")
    }
    
    const avatar = await uploadOnCloud(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Eroor while uploading")
    }

    const user = await User.findByIdAndUpdate(req.user._id,{
        $set : {
            avatar : avatar.url
        }
    },{new : true})

    return res.status(200).json(new ApiResponse(200,user,"Avatar image updated "))
})


const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverLocalPath = req.file.path 

    if(!coverLocalPath){
        throw new ApiError(400,"Cover image missing")
    }
    
    const coverimage = await uploadOnCloud(coverLocalPath)

    if(!coverimage.url){
        throw new ApiError(400,"Eroor while uploading")
    }

    const user = await User.findByIdAndUpdate(req.user._id,{
        $set : {
            coverimage : coverimage.url
        }
    },{new : true})

    return res.status(200).json(new ApiResponse(200,user,"Cover image updated "))

})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel = await User.aggregate([
        {
        $match : {
            username : username?.toLowerCase()
        }
    },
    {
        $lookup: {
            from : "subcriptions",
            localField :"_id" ,
            foreignField : "channel",
            as : "subscribers"
        }

    },
    {
        $lookup: {
            from : "subcriptions",
            localField :"_id" ,
            foreignField : "subscriber",
            as : "subscribedTo"
        }

    },
    {
        $addFields : {
            subscriberCount : {
                $size : "$subscribers"
            },
            channelsSubscribedToCount : {
                $size : "$subscribedTo"

            },
            isSubscribed : {
                $cond : {
                    if : {$in : [req.user?._id, "$subscribers.subscriber"]},
                    then : true,
                    else : false
                }
            }
        }
    },
    {
        $project : {
            fullname : 1,
            username : 1,
            subscriberCount : 1,
            channelsSubscribedToCount : 1,
            isSubscribed : 1,
            coverImage : 1,
            avatar : 1,
            email : 1

        }
    }
])
if(!channel?.length){
    throw new ApiError(404,"channel not exits ")
}

console.log(channel);

return res.status(200).json(new ApiResponse(200,channel[0],"User channel fetched succesfully "))



})


const getWatchHistory = asyncHandler(async(req,res)=>{

    const user = await User.aggregate([
        {
            $match : {
                _id : new Mongoose.Types.ObjectId(req.user._id) //here mongoose doesnt work so you have to write complete Id
            } 

        },
        {
            $lookup : {
                from  : "videos",
                localField: "watchHistory",
                foreignField : "_id" ,
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullname : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $firstn: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    res.status(200).json(
        new ApiResponse(200,user[0].watchHistory,"watch history getched ")
    )

})

export { registerUser,loginUser,logOutUser,refreshAccessToken,changeCurrentUser,getCurrentUser,updateAccoutDetails,updateUserAvatar,updateUserCoverImage,getUserChannelProfile,getWatchHistory };