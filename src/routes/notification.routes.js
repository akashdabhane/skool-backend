import express from "express";
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const notificationRouter = express.Router();

notificationRouter.use(verifyJWT);

notificationRouter.route("/").get(getNotifications);
notificationRouter.route("/:id/read").patch(markNotificationRead);
notificationRouter.route("/read-all").patch(markAllNotificationsRead);

export default notificationRouter;
