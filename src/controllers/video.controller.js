import mongoose, {isValidObjectId} from "mongoose"
import { Video } from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"
import { uploadOnCloud } from "../utils/cloudnary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    //how to get views ? 

    const matchStage = query ? {
        $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]} : {};

    const video = await Video.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" }, //converting array into object 
        {
            $addFields: {
                views: { $size: "$viewers" }
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                duration: 1,
                isPublished: 1,
                thumbNail: 1,
                videoFile: 1,
                views: 1,
                "owner.username": 1
            }
        },
        {
            $sort: { [sortBy]: parseInt(sortType) }
        },
        {
            $limit: parseInt(limit)
        }
    ]);

    res.status(200).json(new ApiResponse(200,video,"All videos fetched succesfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    
    /*1. get files from req.body
    2.check file is avalable or not 
    3.get the local path 
    4.upload on clodianry 
    5.create a document
    6.if videos document created send response
    */
   
   const { title, description} = req.body

    console.log(req.files);

    if(!req.files || !req.files.videoFile){
        throw new ApiError(400,"Error while uploading the file")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;

    const thumbNailLocalPath = req.files?.thumbNail[0]?.path;

    if(!videoFileLocalPath){
        throw new ApiError(400,"Video file is requierd")
    }

    if(!thumbNailLocalPath){
        throw new ApiError(400,"Thumbnail is requierd")
    }
    
    const uploadedVideo = await uploadOnCloud(videoFileLocalPath);

    const uploadedThumbnail = await uploadOnCloud(thumbNailLocalPath);

    if(!uploadedVideo){
        throw new ApiError(400,"error while uploading video")
    }

    if(!uploadedThumbnail){
        throw new ApiError(400,"error while uploading thumbnail")
    }

    const savedVideo = await Video.create({
        title,
        description,
        videoFile : uploadedVideo?.url || "",
        thumbNail : uploadedThumbnail?.url || "",
        duration : uploadedVideo?.duration
    })

    const getVideoInfo = await Video.findById(savedVideo._id)


    if(!savedVideo){
        throw new ApiResponse(500,"No video uploaded")
    }

    res.status(200).json(
        new ApiResponse(200,getVideoInfo,"Video uploaded succesfully")
    )


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    
    const getVideo = await Video.findById(videoId);

    if(!getVideo){
        throw new ApiResponse(200,getVideo,"Vide fetched succesfully ")
    }


})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const {title,description} = req.body;

    if(!title || !description){
        throw new ApiError(400,"title or description is required ")
    }

    if(!req.files.thumbnail){
        throw new ApiError(400,"thumbnail is not uploaded ")

    }

    const thubnailLocalPath = req.files?.thumbnail[0]?.path;

    const uploadedThumbnail = await uploadOnCloud(thubnailLocalPath)

    if(!uploadedThumbnail){
        throw new ApiError(400,"Error uplaoding thumbnail")
    }

    const video = Video.findByIdAndUpdate(req.params.videoId,
        {
            $set : {
                title : title,
                description : description,
                thumbNail : uploadedThumbnail?.path
            }
        },
        {
            new : true
        }
    )

    if(!video){
        throw new ApiError(400,"error while editing video")
    }

    res.status(200).json(
        new ApiResponse(200,video,"Video updated succesdully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    await Video.findByIdAndUpdate(req.params.videoId,{
        $unset : {
            videoFile : undefined,
            thumbNail : undefined,
            duration : undefined
        }
    },{
        new : true
    })

    res.status(200).json(new ApiResponse(200,{},"Video deleted succesfully !"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const toggle = function(value){
        if(value == true) return false;
        else return true;
    }

    await Video.findByIdAndUpdate(videoId,{
        $unset  : {
            published : toggle()
        }
    },{
        new : true
    })

    res.status(200).json(new ApiResponse(200,{},"Publish Status Toggled "))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}