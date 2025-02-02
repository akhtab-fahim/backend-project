import {asyncHandler} from "../utils/asynchandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { upload } from "../middlewares/multer.middlware.js"
import { uploadOnCloud } from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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


export { registerUser };