import { Notification } from "../models/notification.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const notifications = await Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(50);

    return res
        .status(200)
        .json(new ApiResponse(200, notifications, "Notifications fetched successfully"));
});

const markNotificationRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
        { _id: id, user: userId },
        { $set: { isRead: true } },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, notification, "Notification marked as read"));
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await Notification.updateMany({ user: userId }, { $set: { isRead: true } });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "All notifications marked as read"));
});

export {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
};
