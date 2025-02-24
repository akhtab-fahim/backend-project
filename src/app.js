import express from "express"
import cors from "cors"
import cookieparser from "cookie-parser"


const app = express()

//middleware setup

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({
    limit : "16kb"
}))

app.use(express.urlencoded({extended:true, limt : "16kb"}))

app.use(express.static("public"))

app.use(cookieparser())


//routes import

import userRouter from "./routes/user.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import healthCheckRouter from "./routes/healthcheck.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import videoRouter from "./routes/video.routes.js"
import playlistRouter from "./routes/playlist.routes.js"

//routes declaration
app.use("/users", userRouter)
app.use("/tweets",tweetRouter)
app.use("/check",healthCheckRouter)
app.use("/comment",commentRouter)
app.use("/like",likeRouter)
app.use("/videos",videoRouter)
app.use("/playlist",playlistRouter)

export default app