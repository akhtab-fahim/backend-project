import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"
import { Tweet } from "../models/tweet.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const comments = await Comment.aggregate([
        {
            $match: {
                "video": mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $project: {
                content: 1
            }
        },
        {
            $skip: (page - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ])

    res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content } = req.body;
    const {videoId} = req.params;

    const comment = await Comment.create({
        content,
        video : videoId,
        owner : req.user._id
    })

    const getCommnet = await Comment.findById(comment._id).select("-video -owner")

    if(!getCommnet){
        throw new ApiError(401,"No comment has been added")
    }

    req.status(200).json(new ApiResponse(200,getCommnet,"Comment has been succesfully added"))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {content} = req.body;

    if(!content){
        throw new ApiResponse(401,"No content has been given !")
    }

    const tweet = await Tweet.findById(commentId)
    if(!tweet){
        throw new ApiError(401,"No comment is there for the given video")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweet._id,{
        $set: {
            content : content
        }
    },{new : true})

    req.status(200).json(new ApiResponse(200,{},"Comment has been updated succesfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;

    const tweet = await Tweet.findById(commentId)
    if(!tweet){
        throw new ApiError(401,"No comment is there for the given video")
    }

    const updatedTweet = await Tweet.findByIdAndDelete(tweet._id)

    req.status(200).json(new ApiResponse(200,{},"Comment has been deleted succesfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }