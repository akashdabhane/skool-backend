import express from "express"
const userRouter = express.Router();
import {
    userRegister,
    userLogin,
    getCurrentUser,
    changeCurrentPassword,
    updateUserInfo,
    logoutUser,
    updateProfilePhoto,
    forgetPassword,
    resetPassword,
    updateEmail,
    resetEmail,
} from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"

userRouter.route('/register').post(userRegister);
userRouter.route('/login').post(userLogin);

// secure routes
// get single user
userRouter.route('/current-user').get(verifyJWT, getCurrentUser);
userRouter.route('/logout').post(verifyJWT, logoutUser);
userRouter.route('/change-password').post(verifyJWT, changeCurrentPassword); // not working check it out

// update users info
userRouter.route('/update-user-info').patch(verifyJWT, updateUserInfo); 

userRouter.route('/update-profile-photo').patch(verifyJWT, upload.single("profileImg"), updateProfilePhoto);
userRouter.route('/forgot-password').post(forgetPassword);
userRouter.route('/reset-password').patch(resetPassword);
userRouter.route('/update-email').post(verifyJWT, updateEmail);
userRouter.route('/reset-email').patch(verifyJWT, resetEmail);

export default userRouter;