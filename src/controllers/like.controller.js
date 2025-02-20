import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        res.status(200).json(new ApiResponse(200, {}, "Video unliked"))
    } else {
        const newLike = await Like.create({
            video: videoId,
            comment: null,
            tweet: null,
            likedBy: req.user._id
        })
        res.status(200).json(new ApiResponse(200, newLike, "Video liked"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const likeComment = await Like.create({
        comment : commentId,
        likedBy : req.user._id
    })

    if(likeComment){
        await Like.findByIdAndDelete(likeComment._id)
        res.status(200).json(new ApiResponse(200,{},"Comment disliked"))
    }else{
        const newCommentLike = await Like.create({
            video: null,
            comment: commentId,
            tweet: null,
            likedBy: req.user._id
        })

        res.status(201).json(new ApiResponse(200,newCommentLike,"Comment Liked"))
    }

})


const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const likeTweet = await Tweet.create({
        tweet : tweetId,
        likedBy : req.user._id
    })

    if(likeTweet){
        await Tweet.findByIdAndDelete(likeTweet._id)
        res.status(200).json(new ApiResponse(200,{},"Tweet disliked"))
    }else{
        const newTweetLike = await Tweet.create({
            video: null,
            comment: null,
            tweet: tweetId,
            likedBy: req.user._id
        })

        res.status(200).json(new ApiResponse(200,newTweetLike,"Tweet liked"))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: { likedBy: req.user._id }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $project: {
                videoId: "$video",
                likedAt: "$createdAt"
            }
        },
        {
            $sort: { likedAt: -1 }
        }
    ]);

    if (likedVideos.length === 0) {
        throw new ApiError(404, "No liked videos found");
    }

    res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}