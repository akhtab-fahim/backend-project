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

    const videos = await Video.aggregate([
        {
            $match: {
              owner : new mongoose.Schema.Types.ObjectId(userId)
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                duration: 1,
                isPublished: 1,
                thumbnail: 1,
                videoFile: 1,
                views: 1,
                createdAt : 1
            }
        },
        {
            $sort: {
                createdAt : -1
            }
        },
        {
            $limit: parseInt(limit)
        }
    ]);

    if(!videos){
        throw new ApiError(400,"Theres no video corresponding to that user ")
    }

    res.status(200).json(new ApiResponse(200,videos,"All videos fetched succesfully"))
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

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path || req.files?.videoFile?.path;
    const thumbNailLocalPath = req.files?.thumbnail?.[0]?.path || req.files?.thumbnail?.path;

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

    const video = await Video.create({
        title,
        description,
        views : null,
        videoFile : uploadedVideo?.url || "",
        thumbnail : uploadedThumbnail?.url || "",
        duration : uploadedVideo?.duration,
        owner : req.user._id
    })

    const getVideoInfo = await Video.findById(video._id).select("-owner -videoFile -thumbNail")


    if(!getVideoInfo){
        throw new ApiResponse(500,"No video uploaded")
    }

    res.status(200).json(
        new ApiResponse(200,getVideoInfo,"Video uploaded succesfully")
    )


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    
    const getVideo = await Video.findById(videoId).select("-owner ")

    if(!getVideo){
        throw new ApiResponse(200,getVideo,"Video fetched succesfully ")
    }

    res.status(200).json(new ApiResponse(200,getVideo,"Video fetched by ID"));

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title or description is required");
    }

    console.log("Uploaded files:", req.files);

    if (!req.files || !req.files.thumbnail) {
        throw new ApiError(400, "Thumbnail is not uploaded");
    }

    const thumbNailLocalPath = req.files?.thumbnail?.[0]?.path || req.file?.path;

    const uploadedThumbnail = await uploadOnCloud(thumbNailLocalPath);

    if (!uploadedThumbnail) {
        throw new ApiError(400, "Error uploading thumbnail");
    }

    const getVideoById = await Video.findById(videoId)

    if(!getVideoById){ throw new ApiError(400,"Theres no video fot the coresponding Id")}


    const video = await Video.findByIdAndUpdate(videoId,{
        $set : {
            title,
            description,
            thumbnail : uploadedThumbnail.url
        }
    },{new : true});

    if (!video) {
        throw new ApiError(400, "Error while editing video");
    }

    res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    await Video.findByIdAndDelete(videoId)

    res.status(200).json(new ApiResponse(200,{},"Video deleted succesfully !"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const toggle = function(value){
        if(value == true) return false;
        else return true;
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.isPublished = !video.isPublished;

    await video.save();

    res.status(200).json(new ApiResponse(200,video,"Publish Status Toggled "))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}