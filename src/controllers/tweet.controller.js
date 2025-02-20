import mongoose, { isValidObjectId, mongo, Mongoose } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
// import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    // console.log(content)

    if(!content){
        throw new ApiError(400,"theres no content ")
    }
    
    
    const tweet = await Tweet.create({
        owner : req.user._id,
        content
    })

    const getTweetInfo = await Tweet.findById(tweet._id)

    if(!getTweetInfo){
        throw new ApiError("Tweet has not created")
    }

    // console.log(Tweet.owner);
    

    res.status(200).json(new ApiResponse(200,getTweetInfo,"Tweet has been created succesfully "))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params;


    const allUserTweets = await Tweet.aggregate([
        {
          $match: {
            "owner" : new mongoose.Types.ObjectId(userId)
          }
        },
        {
          $project: {
            content : 1
          }
        }
      ])

    if(allUserTweets.length == 0){
        throw new ApiError(401,"No value retireved ")
    }

    console.log(allUserTweets);
    
    res.status(200).json(new ApiResponse(200,allUserTweets,"All User Tweets Retrieved "))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params;
    const {content} = req.body;
    
    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(401,"Theres no existing tweet to delete")
    }

    const updatedTweeTinfo = await Tweet.findByIdAndUpdate(tweetId,{
        $set : {
            content : content
        }
    },{ new : true}).select("-owner")

    // console.log(updatedTweeTinfo);
    
        
    
    res.status(200).json(new ApiResponse(200,updatedTweeTinfo,"Tweet updated succesfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(401,"Theres no existing tweet to delete")
    }

    if(!(tweet.owner.toString() === req.user._id.toString())){    
        throw new ApiError(401,"You are not authorized to delete the tweet")
    }
    
    await Tweet.findByIdAndDelete(tweetId)

    res.status(200).json(new ApiResponse(200,{},"Tweet deleted succesfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}