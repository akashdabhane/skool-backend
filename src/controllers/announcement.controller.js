import { Announcement } from "../models/announcement.model.js";
import { User } from "../models/user.model.js";
import { Class } from "../models/class.model.js";
import { MediaReference } from "../models/mediaReference.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createAnnouncement = asyncHandler(async (req, res) => {
    const { createdBy, announceMessage, classroom } = req.body;

    if ([createdBy, announceMessage, classroom].some(field => {
        return field?.trim() === "" || field?.trim() === undefined
    })) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findById(createdBy);
    if (!user) throw new ApiError(401, "User not found");

    const classroomExists = await Class.findById(classroom);
    if (!classroomExists) throw new ApiError(404, "Classroom not found");

    const mediaReference = await MediaReference.create({
        videoFile: req?.body?.videoFile,
        youtubeVideo: req?.body?.youtubeVideo,
        documentFile: req?.body?.documentFile,
        link: req?.body?.link
    });

    const announcement = await Announcement.create({
        announceMessage,
        createdBy: user._id,
        classroom,
        mediaReference: mediaReference._id
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, announcement, "Announcement created successfully")
        );
})

const deleteAnnouncement = asyncHandler(async (req, res) => {
    const { id } = req.params;  // announcement id

    const announcement = await Announcement.findById(id);
    if (!announcement) throw new ApiError(404, "Announcement not found");

    if (!announcement.createdBy.equals(req.user._id)) {
        throw new ApiError(401, "Unauthorized to delete this announcement");
    }

    await MediaReference.findByIdAndDelete(announcement.mediaReference);  // delete media reference first
    await Announcement.findByIdAndDelete(id);   // delete announcement

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Announcement deleted successfully")
        );
})

const getAllAnnouncements = asyncHandler(async (req, res) => {
    const { id } = req.params; // classroom id

    const announcements = await Announcement.find({ classroom: id }).populate("createdBy");
    if (!announcements) throw new ApiError(404, "Announcements not found for this classroom");

    return res
        .status(200)
        .json(
            new ApiResponse(200, announcements, "Announcements fetched successfully")
        );
})

const getAnnouncementById = asyncHandler(async (req, res) => {
    const { id } = req.params;    // announcement id

    const announcement = await Announcement.findById(id).populate("createdBy");
    if (!announcement) throw new ApiError(404, "Announcement not found");

    return res
        .status(200)
        .json(
            new ApiResponse(200, announcement, "Announcement fetched successfully")
        );
})

const updateAnnouncement = asyncHandler(async (req, res) => {
    const { id } = req.params;    // announcement id
    // const { announceMessage, link } = req.body;
    // use multer for media reference

    // if (!announceMessage || announceMessage.trim() === "") {    // validate media reference here
    //     throw new ApiError(400, "Announcement message are required");
    // }

    const announcement = await Announcement.findByIdAndUpdate(id,
        {
            $set: { announceMessage: req?.body?.announcementMessage }
        },
        { new: true, runValidators: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, announcement, "Announcement updated successfully")
        );
})


export {
    createAnnouncement,
    deleteAnnouncement,
    getAllAnnouncements,
    getAnnouncementById,
    updateAnnouncement
}