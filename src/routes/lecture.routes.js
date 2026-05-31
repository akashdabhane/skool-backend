import express from "express";
import {
    createLecture,
    updateLecture,
    cancelLecture,
    getLectureById,
    getLecturesByClassroom,
} from "../controllers/lecture.controller.js";
import {
    joinLectureAttendance,
    leaveLectureAttendance,
    getLectureAttendance,
} from "../controllers/attendance.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const lectureRouter = express.Router();

lectureRouter.use(verifyJWT);

lectureRouter.route("/create").post(createLecture);
lectureRouter.route("/update/:id").patch(updateLecture);
lectureRouter.route("/cancel/:id").patch(cancelLecture);
lectureRouter.route("/classroom/:classId").get(getLecturesByClassroom);
lectureRouter.route("/:id").get(getLectureById);
lectureRouter.route("/:id/attendance/join").post(joinLectureAttendance);
lectureRouter.route("/:id/attendance/leave").patch(leaveLectureAttendance);
lectureRouter.route("/:id/attendance").get(getLectureAttendance);

export default lectureRouter;
