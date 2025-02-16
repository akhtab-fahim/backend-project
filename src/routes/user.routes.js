import { Router } from "express";
import { changeCurrentUser, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logOutUser, refreshAccessToken, registerUser, updateAccoutDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { publishAVideo } from "../controllers/video.controller.js";

const router = Router();

router.route("/register").post(upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverimage", maxCount: 1 }
]), registerUser);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logOutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT,changeCurrentUser);

router.route("/current-user").get(verifyJWT,getCurrentUser);

router.route("/update-details").patch(updateAccoutDetails);

router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);

router.route("/update-coverimage").patch(verifyJWT,upload.single("coverimage"),updateUserCoverImage);

router.route("/c/:username").get(verifyJWT,getUserChannelProfile);

router.route("/history").get(verifyJWT,getWatchHistory);



export default router;
