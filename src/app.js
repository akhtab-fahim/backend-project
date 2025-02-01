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

//routes declaration
app.use("/users", userRouter)

export default app