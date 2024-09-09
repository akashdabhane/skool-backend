import { User } from '../models/user.model.js';
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
// import { sendEmail } from '../utils/sendEmail.js';
import crypto from "crypto"
import { extractPublicId } from '../utils/extractPublicId.js';


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const options = {
    httpOnly: true,
    secure: true
}

// register user
const userRegister = asyncHandler(async (req, res) => {
    const { email, password, firstname, lastname } = req.body;

    if ([email, password, firstname, lastname].some((field) =>
        field?.trim() === "" || field?.trim() === undefined
    )) {
        throw new ApiError(400, "All fields are required");
    }

    let isUserExist = await User.findOne({ email });

    if (isUserExist) throw new ApiError(405, "User with this email already exist");

    const user = await User.create({
        email,
        password,
        firstname,
        lastname
    })
    console.log(user)
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) throw new ApiError(500, "Something went wrong while registering user");

    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User registered successfully")
        );
})

// login
const userLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if ([email, password].some((field) =>
        field?.trim() === "" || field?.trim() === undefined
    )) {
        throw new ApiError(400, "All fields are required");
    }

    // Regex for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    if (password.length <= 6 || password.length >= 16) throw new ApiError(400, "Password length must be between 6 to 16 letters.");

    const user = await User.findOne({ email })
    if (!user) throw new ApiError(404, "User does not exist");

    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if (!isPasswordCorrect) throw new ApiError(401, "Incorrect password");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully",)
        )
})

// logout
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: null }
        },
        { new: true }
    )

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        )
})

// refresh/update access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "anauthorized request")
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if (!user) {
        throw new ApiError(401, "Invalid refresh token")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used")
    }

    const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200,
                { accessToken, refreshToken: newRefreshToken },
                "Access token refreshed"
            )
        )
})

// change password of user
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (newPassword.length < 6 || newPassword.length > 15) {
        throw new ApiError(400, "new password should be at least 6 and max 15 characters long")
    }

    if (oldPassword === newPassword) {
        throw new ApiError(400, "new password should be different from old password")
    }

    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200)
        .json(
            new ApiResponse(200, {}, "Password changed successfully")
        )
})

// get user
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "current user fetched successfully")
        );
})

// update user info     // think no need to have this endpoint becoz email, password, profileImg update has separate endpoints
const updateUserInfo = asyncHandler(async (req, res) => {
    console.log(req.body)

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: req.body
        },
        { runValidators: true, new: true }
    )

    if (!updatedUser) throw new ApiError(500, "Failed to update user information");

    return res
        .status(200)
        .json(
            new ApiResponse(200, { user: updatedUser }, "User information updated successfully")
        );
})

// update profile photo 
const updateProfilePhoto = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const LocalPhotoPath = req.file?.path;

    const photo = await uploadOnCloudinary(LocalPhotoPath);

    if (!photo) throw new ApiError(500, "Failed to upload photo");

    if (req.user?.profilePicture) {
        const publicId = extractPublicId(req.user.profilePicture);
        await deleteFromCloudinary(publicId);
    }

    const updateProfilePhoto = await User.findByIdAndUpdate(userId,
        {
            $set: {
                profilePicture: photo.secure_url,
            }
        },
        { new: true }
    )

    if (!updateProfilePhoto) {
        throw new ApiError(500, "Failed to update profile photo")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { user: updateProfilePhoto }, "Profile photo updated successfully")
        )
})

// forget password functionality  // not working for now  // it just send email and store reset password token in db
const forgetPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const token = crypto.randomBytes(20).toString('hex');

    if (!email) {
        throw new ApiError(400, "Email is required")
    }

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(404, "User not found with this email")
    }

    const k = await User.findOneAndUpdate(
        { email },
        {
            $set: {
                resetPasswordToken: token,
            }
        }
    )

    console.log('k', k)
    const mailOptions = {
        to: email,
        from: process.env.MY_EMAIL,
        subject: 'Password Reset',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
              Please click on the following link, or paste this into your browser to complete the process:\n\n
              http://${req.headers.host}/reset-password/?token=${token}\n\n
              If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    const sendEmailStatus = sendEmail(mailOptions);
    console.log('336', sendEmailStatus)
    if (!sendEmailStatus) throw new ApiError(500, "Failed to send email to user");

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Reset password link sent successfully")
        );
})

// reset password functionality
const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;  // token, 
    const { token } = req.params;

    if (!token) {
        throw new ApiError(400, "Token is required")
    }

    if (!password) {
        throw new ApiError(400, "Password is required")
    }

    try {
        const user = await User.findOne({ resetPasswordToken: token })

        if (!user) {
            throw new ApiError(404, "User not found or token expired")
        }

        user.password = password;
        user.resetPasswordToken = "";
        // user.resetPasswordTokenExpires = undefined;

        await user.save()
        return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully"))

    } catch (error) {
        throw new ApiError(500, "Something went wrong while resetting password")
    }
})

// send request to update email 
const updateEmail = asyncHandler(async (req, res) => {
    const { newEmail } = req.body;
    const userId = req.user._id;

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        throw new ApiError(400, 'Invalid email format')
    }

    const user = await User.findOne({ email: newEmail });
    if (user) {
        throw new ApiError(400, 'Email is already in use')
    }

    function generateOTP(length) {
        if (length !== 4 && length !== 6) {
            throw new Error('OTP length must be either 4 or 6');
        }
        const otp = crypto.randomInt(0, 10 ** length).toString().padStart(length, '0');
        return otp;
    }

    const otp = generateOTP(6)
    console.log(otp)

    // set token in db for verification of email
    user.resetEmailOrPhoneToken = otp;

    // send email with otp
    const mailOptions = {
        to: newEmail,
        from: 'no-reply@example.com',   // process.env.MY_EMAIL
        subject: 'OTP for updating/verify email',
        text: `please enter this OTP ${otp} to update/verfiy your email.`,
    };

    sendEmial(mailOptions);

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Verification email sent to new email')
        )
})

// verify by otp to update email
const resetEmail = asyncHandler(async (req, res) => {
    const { otp, newEmail } = req.body;
    const userId = req.user._id;

    if (!otp || otp.length !== 6) {
        throw new ApiError(400, 'Invalid OTP')
    }

    const user = await User.findById(userId);

    if (user.resetEmailOrPhoneToken !== otp) {
        throw new ApiError(400, 'Invalid OTP')
    }

    user.email = newEmail;
    user.resetEmailOrPhoneToken = null;

    await user.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, 'Email updated successfully')
        );
})


export {
    userRegister,
    userLogin,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserInfo,
    updateProfilePhoto,
    forgetPassword,
    resetPassword,
    updateEmail,
    resetEmail,
}