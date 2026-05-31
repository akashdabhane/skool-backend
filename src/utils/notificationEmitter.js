import { Notification } from "../models/notification.model.js";
import { getSocket } from "../socket.js";

const emitNotificationToUsers = async ({ userIds, classroom, type, message, link }) => {
    const notifications = await Notification.insertMany(
        userIds.map((userId) => ({
            user: userId,
            classroom: classroom || null,
            type,
            message,
            link: link || "",
        }))
    );

    const io = getSocket();
    if (io) {
        notifications.forEach((notification) => {
            io.to(notification.user.toString()).emit("notification", notification);
        });
    }

    return notifications;
};

export { emitNotificationToUsers };
