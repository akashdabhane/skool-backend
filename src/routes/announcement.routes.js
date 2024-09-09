import express from "express";
const announcementRouter = express.Router();
import {
    createAnnouncement,
    deleteAnnouncement,
    getAllAnnouncements,
    getAnnouncementById,
    updateAnnouncement
} from "../controllers/announcement.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

announcementRouter.use(verifyJWT);
announcementRouter.route("/create-announcement").post(upload.single("file"), createAnnouncement);
announcementRouter.route("/delete-announcement/:id").delete(deleteAnnouncement);
announcementRouter.route("/get-all-announcements/:id").get(getAllAnnouncements);
announcementRouter.route("/get-announcementById/:id").get(getAnnouncementById);
announcementRouter.route("/update-announcement/:id").patch(updateAnnouncement);

export default announcementRouter;
