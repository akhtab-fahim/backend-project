import {asyncHandler} from "../utils/asynchandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { upload } from "../middlewares/multer.middlware.js"
import { uploadOnCloud } from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req,res) => {
    const {fullname, email, username, password} = req.body
    console.log(email)

    /* validation */

    // if(fullname === ""){
    //     throw new ApiError(400,"full name is required");
    // }

    if([fullname,email,username,password].some((field)=> field?.trim() === "")){
        throw new ApiError(400,"all fields are required")
    }

    /* Check user already exists or not */
    const existedUser = User.findOne({
        $or : [{ username },{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"User already existed")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;

    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath)    throw new ApiError(400,"Avatar is required")

    const avatar = await uploadOnCloud(avatarLocalPath)
    const coverImage = await uploadOnCloud(coverImageLocalPath)

    if(!avatar) throw new ApiError(400,"Avatar file is must required ")

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" //kya kya nahi chahiye
    )

    if(!createdUser) {
        throw new ApiError(500,"No user created")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser, "User registered Succesfully ")
    )

})


export { registerUser };